import { createPrivateKey, createPublicKey } from 'node:crypto';
import { SignJWT, importPKCS8, importSPKI, jwtVerify } from 'jose';
import { config } from '../config/env';

export interface JwtPayload {
  user_id: string;
  email: string;
  session_id: string;
  token_type?: 'access';
}

const privateKey = importPKCS8(normalizePem(config.JWT_PRIVATE_KEY, 'private'), 'RS256');
const publicKey = importSPKI(normalizePem(config.JWT_PUBLIC_KEY, 'public'), 'RS256');

async function signToken(payload: JwtPayload, expirationTime: string): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(await privateKey);
}

export async function signAccessToken(payload: Omit<JwtPayload, 'token_type'>): Promise<string> {
  return signToken({ ...payload, token_type: 'access' }, '15m');
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, await publicKey);
  return {
    user_id: payload['user_id'] as string,
    email: payload['email'] as string,
    session_id: payload['session_id'] as string,
    token_type: payload['token_type'] as JwtPayload['token_type'],
  };
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token);
  if (payload.token_type !== 'access') throw new Error('Invalid access token');
  return payload;
}

export function normalizePem(value: string, kind: 'private' | 'public'): string {
  let pem = value.trim();
  if (
    (pem.startsWith('"') && pem.endsWith('"')) ||
    (pem.startsWith("'") && pem.endsWith("'"))
  ) {
    pem = pem.slice(1, -1).trim();
  }
  pem = pem.replace(/\\n/g, '\n');

  if (kind === 'private' && pem.includes('BEGIN RSA PRIVATE KEY')) {
    const key = createPrivateKey({ key: pem, format: 'pem' });
    pem = key.export({ type: 'pkcs8', format: 'pem' }) as string;
  }

  if (kind === 'public' && pem.includes('BEGIN RSA PUBLIC KEY')) {
    const key = createPublicKey({ key: pem, format: 'pem' });
    pem = key.export({ type: 'spki', format: 'pem' }) as string;
  }

  return pem;
}

export async function validateJwtKeys(): Promise<void> {
  try {
    await importPKCS8(normalizePem(config.JWT_PRIVATE_KEY, 'private'), 'RS256');
  } catch (err) {
    throw new Error(`JWT_PRIVATE_KEY inválida (use PKCS#8 BEGIN PRIVATE KEY): ${err}`);
  }
  try {
    await importSPKI(normalizePem(config.JWT_PUBLIC_KEY, 'public'), 'RS256');
  } catch (err) {
    throw new Error(`JWT_PUBLIC_KEY inválida (use SPKI BEGIN PUBLIC KEY): ${err}`);
  }
}
