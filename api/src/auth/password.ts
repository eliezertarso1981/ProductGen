import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import argon2 from 'argon2';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 12;
const MIN_SIGNUP_PASSWORD_LENGTH = 8;

export function validatePasswordPolicy(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error('Senha deve ter no mínimo 12 caracteres');
  }
}

export function validateSignupPassword(password: string): void {
  if (password.length < MIN_SIGNUP_PASSWORD_LENGTH) {
    throw new Error('Senha deve ter no mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/\d/.test(password)) {
    throw new Error('Senha deve conter pelo menos um número');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Senha deve conter pelo menos um caractere especial');
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);
  return hashPasswordUnsafe(password);
}

export async function hashSignupPassword(password: string): Promise<string> {
  validateSignupPassword(password);
  return hashPasswordUnsafe(password);
}

async function hashPasswordUnsafe(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 4,
  });
}

export { hashPasswordUnsafe };

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (passwordHash.startsWith('$argon2id$')) {
    return argon2.verify(passwordHash, password);
  }

  // Compatibilidade temporária para seeds/sessões locais criados antes do doc 14.
  const [algorithm, salt, key] = passwordHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !key) return false;

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedKey = Buffer.from(key, 'hex');

  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}
