import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value: string) {
  return BCRYPT_RE.test(value);
}

export function hashUserPassword(plain: string) {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

export function verifyUserPassword(stored: string, plain: string) {
  if (!stored || !plain) return false;
  if (isBcryptHash(stored)) {
    return bcrypt.compareSync(plain, stored);
  }
  return stored === plain;
}
