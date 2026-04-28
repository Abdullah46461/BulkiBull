-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- Seed a local owner for existing MVP data.
INSERT INTO "User" ("id", "email", "passwordHash", "updatedAt")
VALUES (
    'seed-user-local',
    'demo@bulki.local',
    'scrypt$16384$8$5$bulki-demo-salt-2026$l0b2gVrDjzHuFHyJMaut1uIqQho3-HXYMWY75GCMKxWRc56sj7bJCf00fhMLhjUktxs-ERLXRGWVmFrMTB0T_w',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- AlterTable
ALTER TABLE "Bull" ADD COLUMN "userId" TEXT;
UPDATE "Bull" SET "userId" = 'seed-user-local' WHERE "userId" IS NULL;
ALTER TABLE "Bull" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FeedStock" ADD COLUMN "userId" TEXT;
UPDATE "FeedStock" SET "userId" = 'seed-user-local' WHERE "userId" IS NULL;
ALTER TABLE "FeedStock" ALTER COLUMN "userId" SET NOT NULL;

-- DropIndex
DROP INDEX "Bull_tagNumber_key";

-- DropIndex
DROP INDEX "FeedStock_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bull_userId_tagNumber_key" ON "Bull"("userId", "tagNumber");

-- CreateIndex
CREATE INDEX "Bull_userId_idx" ON "Bull"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedStock_userId_type_key" ON "FeedStock"("userId", "type");

-- CreateIndex
CREATE INDEX "FeedStock_userId_idx" ON "FeedStock"("userId");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bull" ADD CONSTRAINT "Bull_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedStock" ADD CONSTRAINT "FeedStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
