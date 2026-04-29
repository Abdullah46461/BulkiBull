import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { after, afterEach, before, test } from 'node:test';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';
import {
  calculateFeedAvailability,
  calculateFeedRemainingStockKg,
  type AuthSessionResponse,
  type BullDetailResponse,
  type BullResponse,
  type FeedResponse,
  type WeightRecordResponse,
} from '@bulki-bull/shared';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { createEmailVerificationToken, hashEmailVerificationToken } from '../src/auth/auth.crypto';

const execFileAsync = promisify(execFile);
const defaultPassword = 'very-strong-password-123';
const repoRoot = resolve(__dirname, '../..');
const prismaSchemaPath = resolve(__dirname, '../prisma/schema.prisma');
const baseDatabaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://bulki:bulki@localhost:5432/bulki_bull?schema=public';
const testSchema = `api_test_${randomUUID().replace(/-/g, '')}`;
const testDatabaseUrl = withSchema(baseDatabaseUrl, testSchema);
const adminDatabaseUrl = withSchema(baseDatabaseUrl, 'public');

process.env.DATABASE_URL = testDatabaseUrl;
process.env.PORT = '0';
process.env.API_PUBLIC_URL = 'http://127.0.0.1:3000';
process.env.SMTP_PROVIDER = '';
process.env.SMTP_HOST = '';
process.env.SMTP_PORT = '';
process.env.SMTP_SECURE = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASSWORD = '';
process.env.EMAIL_FROM = '';

let app: NestExpressApplication;
let prisma: PrismaClient;
let adminPrisma: PrismaClient;
let baseUrl = '';

before(async () => {
  await execFileAsync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'db', 'push', '--schema', prismaSchemaPath, '--skip-generate'],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
    },
  );

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
  });
  adminPrisma = new PrismaClient({
    datasources: {
      db: {
        url: adminDatabaseUrl,
      },
    },
  });

  const { createApp } = await import('../src/bootstrap');
  app = await createApp();
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});

afterEach(async () => {
  await prisma.emailVerificationToken.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.weightRecord.deleteMany();
  await prisma.feedStock.deleteMany();
  await prisma.bull.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await app.close();
  await prisma.$disconnect();
  await adminPrisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
  await adminPrisma.$disconnect();
});

test('auth flow covers register, verify, login, me, and logout', async () => {
  const email = createEmail();

  const registerResponse = await jsonRequest('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: defaultPassword,
    },
  });

  assert.equal(registerResponse.status, 201);
  assert.equal(registerResponse.body.status, 'verification_required');
  assert.equal(registerResponse.body.email, email);
  assert.equal(registerResponse.body.delivery, 'dev_console');

  const preVerifyLoginResponse = await jsonRequest('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: defaultPassword,
    },
  });

  assert.equal(preVerifyLoginResponse.status, 403);
  assert.equal(preVerifyLoginResponse.body.message, 'Подтвердите почту перед входом в аккаунт.');

  const verifyToken = await createVerificationToken(email);
  const verifyResponse = await fetch(
    `${baseUrl}/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );
  const verifyHtml = await verifyResponse.text();

  assert.equal(verifyResponse.status, 200);
  assert.match(verifyHtml, /Почта подтверждена/);

  const loginResponse = await jsonRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: defaultPassword,
    },
  });

  assert.equal(loginResponse.status, 200);
  assert.ok(loginResponse.body.token.length > 20);
  assert.equal(loginResponse.body.user.email, email);
  assert.ok(loginResponse.body.user.emailVerifiedAt);

  const authToken = loginResponse.body.token;
  const meResponse = await jsonRequest('/auth/me', {
    headers: withAuth(authToken),
  });

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.email, email);

  const logoutResponse = await jsonRequest('/auth/logout', {
    method: 'POST',
    headers: withAuth(authToken),
  });

  assert.equal(logoutResponse.status, 204);

  const meAfterLogoutResponse = await jsonRequest('/auth/me', {
    headers: withAuth(authToken),
  });

  assert.equal(meAfterLogoutResponse.status, 401);
  assert.equal(meAfterLogoutResponse.body.message, 'Требуется вход в аккаунт.');
});

test('bull CRUD, weights, and currentWeight work through the API', async () => {
  const authToken = await createVerifiedSession();

  const createBullResponse = await jsonRequest<BullDetailResponse>('/bulls', {
    method: 'POST',
    headers: withAuth(authToken),
    body: {
      tagNumber: 'A-100',
      name: 'Борис',
      birthDate: '2025-01-15',
      breed: 'Герефордская',
      sex: 'MALE',
      arrivalDate: '2025-06-01',
      initialWeight: 380.5,
      photoUrl: null,
      notes: 'Первый бычок',
    },
  });

  assert.equal(createBullResponse.status, 201);
  assert.equal(createBullResponse.body.tagNumber, 'A-100');
  assert.equal(createBullResponse.body.currentWeight, 380.5);
  assert.deepEqual(createBullResponse.body.weightRecords, []);

  const bullId = createBullResponse.body.id;

  const listAfterCreateResponse = await jsonRequest<BullResponse[]>('/bulls', {
    headers: withAuth(authToken),
  });

  assert.equal(listAfterCreateResponse.status, 200);
  assert.equal(listAfterCreateResponse.body.length, 1);
  assert.equal(listAfterCreateResponse.body[0]?.currentWeight, 380.5);

  const firstWeightResponse = await jsonRequest<WeightRecordResponse>(`/bulls/${bullId}/weights`, {
    method: 'POST',
    headers: withAuth(authToken),
    body: {
      date: '2025-07-01',
      weight: 410.75,
      comment: 'После первого месяца',
    },
  });

  assert.equal(firstWeightResponse.status, 201);
  assert.equal(firstWeightResponse.body.weight, 410.75);

  const secondWeightResponse = await jsonRequest<WeightRecordResponse>(`/bulls/${bullId}/weights`, {
    method: 'POST',
    headers: withAuth(authToken),
    body: {
      date: '2025-08-15',
      weight: 438.2,
      comment: 'Последнее взвешивание',
    },
  });

  assert.equal(secondWeightResponse.status, 201);
  assert.equal(secondWeightResponse.body.weight, 438.2);

  const weightsResponse = await jsonRequest<WeightRecordResponse[]>(`/bulls/${bullId}/weights`, {
    headers: withAuth(authToken),
  });

  assert.equal(weightsResponse.status, 200);
  assert.equal(weightsResponse.body.length, 2);
  assert.equal(weightsResponse.body[0]?.weight, 438.2);
  assert.equal(weightsResponse.body[1]?.weight, 410.75);

  const detailResponse = await jsonRequest<BullDetailResponse>(`/bulls/${bullId}`, {
    headers: withAuth(authToken),
  });

  assert.equal(detailResponse.status, 200);
  assert.equal(detailResponse.body.currentWeight, 438.2);
  assert.equal(detailResponse.body.weightRecords.length, 2);
  assert.equal(detailResponse.body.weightRecords[0]?.date, '2025-08-15');

  const updateResponse = await jsonRequest<BullDetailResponse>(`/bulls/${bullId}`, {
    method: 'PATCH',
    headers: withAuth(authToken),
    body: {
      name: 'Борис обновленный',
      notes: 'Комментарий после обновления',
    },
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.name, 'Борис обновленный');
  assert.equal(updateResponse.body.notes, 'Комментарий после обновления');

  const deleteResponse = await jsonRequest(`/bulls/${bullId}`, {
    method: 'DELETE',
    headers: withAuth(authToken),
  });

  assert.equal(deleteResponse.status, 204);

  const listAfterDeleteResponse = await jsonRequest<BullResponse[]>('/bulls', {
    headers: withAuth(authToken),
  });

  assert.equal(listAfterDeleteResponse.status, 200);
  assert.equal(listAfterDeleteResponse.body.length, 0);
});

test('/feeds returns inventory with calculated availability', async () => {
  const authToken = await createVerifiedSession();

  const initialFeedsResponse = await jsonRequest<FeedResponse[]>('/feeds', {
    headers: withAuth(authToken),
  });

  assert.equal(initialFeedsResponse.status, 200);
  assert.deepEqual(
    initialFeedsResponse.body.map((feed) => feed.type),
    ['hay', 'compound_feed'],
  );
  assert.equal(initialFeedsResponse.body[0]?.bullsCount, 0);
  assert.equal(initialFeedsResponse.body[0]?.daysLeft, null);

  await createBull(authToken, 'H-1');
  await createBull(authToken, 'H-2');

  const now = new Date();
  const updateFeedResponse = await jsonRequest<FeedResponse>('/feeds/hay', {
    method: 'PUT',
    headers: withAuth(authToken),
    body: {
      currentStockKg: 100,
      consumptionPerBullPerDayKg: 1.25,
    },
  });

  assert.equal(updateFeedResponse.status, 200);
  assert.equal(updateFeedResponse.body.type, 'hay');
  assert.equal(updateFeedResponse.body.bullsCount, 2);
  assert.equal(updateFeedResponse.body.currentStockKg, 100);
  assert.equal(updateFeedResponse.body.consumptionPerBullPerDayKg, 1.25);

  const expectedAvailability = calculateFeedAvailability(
    {
      bullsCount: 2,
      currentStockKg: 100,
      consumptionPerBullPerDayKg: 1.25,
    },
    now,
  );

  assert.equal(updateFeedResponse.body.dailyConsumptionKg, expectedAvailability.dailyConsumptionKg);
  assert.equal(updateFeedResponse.body.daysLeft, expectedAvailability.daysLeft);
  assert.equal(updateFeedResponse.body.periodStartDate, expectedAvailability.periodStartDate);
  assert.equal(updateFeedResponse.body.depletionDate, expectedAvailability.depletionDate);

  const simulatedYesterday = new Date();
  simulatedYesterday.setDate(simulatedYesterday.getDate() - 1);
  simulatedYesterday.setHours(12, 0, 0, 0);

  await prisma.$executeRawUnsafe(
    'UPDATE "FeedStock" SET "stockSnapshotAt" = $1 WHERE "id" = $2',
    simulatedYesterday,
    updateFeedResponse.body.id,
  );

  const expectedAvailabilityAfterDay = calculateFeedAvailability(
    {
      bullsCount: 2,
      currentStockKg: 100,
      consumptionPerBullPerDayKg: 1.25,
      stockSnapshotAt: simulatedYesterday,
    },
    new Date(),
  );
  const expectedAvailabilityAtYesterdaySave = calculateFeedAvailability(
    {
      bullsCount: 2,
      currentStockKg: 100,
      consumptionPerBullPerDayKg: 1.25,
      stockSnapshotAt: simulatedYesterday,
    },
    simulatedYesterday,
  );
  const expectedRemainingStockAfterDay = calculateFeedRemainingStockKg(
    100,
    expectedAvailability.dailyConsumptionKg,
    simulatedYesterday,
    new Date(),
  );

  const feedsAfterUpdateResponse = await jsonRequest<FeedResponse[]>('/feeds', {
    headers: withAuth(authToken),
  });
  const hayFeed = feedsAfterUpdateResponse.body.find((feed) => feed.type === 'hay');
  const compoundFeed = feedsAfterUpdateResponse.body.find((feed) => feed.type === 'compound_feed');

  assert.equal(feedsAfterUpdateResponse.status, 200);
  assert.ok(hayFeed);
  assert.equal(hayFeed?.bullsCount, 2);
  assert.equal(hayFeed?.currentStockKg, expectedRemainingStockAfterDay);
  assert.equal(hayFeed?.stockSnapshotAt, simulatedYesterday.toISOString());
  assert.equal(hayFeed?.daysLeft, expectedAvailabilityAfterDay.daysLeft);
  assert.equal(hayFeed?.periodStartDate, expectedAvailabilityAfterDay.periodStartDate);
  assert.equal(hayFeed?.depletionDate, expectedAvailabilityAfterDay.depletionDate);
  assert.equal(hayFeed?.depletionDate, expectedAvailabilityAtYesterdaySave.depletionDate);
  assert.ok(compoundFeed);
  assert.equal(compoundFeed?.bullsCount, 2);
  assert.equal(compoundFeed?.currentStockKg, null);
});

async function createVerifiedSession(): Promise<string> {
  const email = createEmail();

  await jsonRequest('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: defaultPassword,
    },
  });

  const verifyToken = await createVerificationToken(email);
  const verifyResponse = await fetch(
    `${baseUrl}/auth/verify-email?token=${encodeURIComponent(verifyToken)}`,
  );

  assert.equal(verifyResponse.status, 200);

  const loginResponse = await jsonRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password: defaultPassword,
    },
  });

  assert.equal(loginResponse.status, 200);
  return loginResponse.body.token;
}

async function createBull(authToken: string, tagNumber: string): Promise<BullDetailResponse> {
  const response = await jsonRequest<BullDetailResponse>('/bulls', {
    method: 'POST',
    headers: withAuth(authToken),
    body: {
      tagNumber,
      name: `Бычок ${tagNumber}`,
      birthDate: '2025-02-01',
      breed: 'Казахская белоголовая',
      sex: 'MALE',
      arrivalDate: '2025-05-01',
      initialWeight: 320,
      photoUrl: null,
      notes: null,
    },
  });

  assert.equal(response.status, 201);
  return response.body;
}

async function createVerificationToken(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  assert.ok(user, 'User should exist before verification');

  const token = createEmailVerificationToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashEmailVerificationToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return token;
}

function createEmail(): string {
  return `test.${randomUUID()}@example.com`;
}

function withAuth(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

async function jsonRequest<T = Record<string, unknown>>(
  path: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{
  status: number;
  body: T;
  text: string;
}> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();

  return {
    status: response.status,
    body: text.length > 0 ? (JSON.parse(text) as T) : (null as T),
    text,
  };
}
