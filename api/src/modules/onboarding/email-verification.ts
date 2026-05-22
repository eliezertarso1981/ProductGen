import { createHash, randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { config } from '../../config/env';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueEmailVerificationToken(pool: Pool, userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresDays = 7;

  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [userId, tokenHash, String(expiresDays)],
  );

  if (config.NODE_ENV !== 'production') {
    console.info('[email-verification] token de confirmação (dev):', rawToken);
  }

  return rawToken;
}

export async function markEmailVerificationSent(_pool: Pool, _userId: string, _token: string): Promise<void> {
  // Stub: integração SendGrid/Resend em iteração futura.
}
