import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const SCRYPT_N = 2 ** 14;
const SCRYPT_R = 8;
const SCRYPT_P = 5;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

const scryptOptions: ScryptOptions = {
  N: SCRYPT_N,
  r: SCRYPT_R,
  p: SCRYPT_P,
  maxmem: SCRYPT_MAXMEM,
};

export const createSessionToken = (): string => randomBytes(32).toString('base64url');

export const hashSessionToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const createEmailVerificationToken = (): string => createSessionToken();

export const hashEmailVerificationToken = (token: string): string => hashSessionToken(token);

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('base64url');
  const derivedKey = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH, scryptOptions);

  return [
    PASSWORD_HASH_ALGORITHM,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt,
    derivedKey.toString('base64url'),
  ].join('$');
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [algorithm, nValue, rValue, pValue, salt, expectedHashValue] = storedHash.split('$');

  if (algorithm !== PASSWORD_HASH_ALGORITHM || !salt || !expectedHashValue) {
    return false;
  }

  const options = parseScryptOptions(nValue, rValue, pValue);

  if (!options) {
    return false;
  }

  const expectedHash = Buffer.from(expectedHashValue, 'base64url');
  const suppliedHash = await scryptAsync(password, salt, expectedHash.length, options);

  return expectedHash.length === suppliedHash.length && timingSafeEqual(expectedHash, suppliedHash);
};

const parseScryptOptions = (
  nValue: string | undefined,
  rValue: string | undefined,
  pValue: string | undefined,
): ScryptOptions | null => {
  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N < 2 ** 12 ||
    N > SCRYPT_N ||
    r < 1 ||
    r > SCRYPT_R ||
    p < 1 ||
    p > SCRYPT_P
  ) {
    return null;
  }

  return {
    N,
    r,
    p,
    maxmem: SCRYPT_MAXMEM,
  };
};
