import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config/env';

export interface JwtPayload {
  user_id: string;
  workspace_id: string;
  role: string;
}

const secret = new TextEncoder().encode(config.JWT_SECRET);

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    user_id: payload['user_id'] as string,
    workspace_id: payload['workspace_id'] as string,
    role: payload['role'] as string,
  };
}
