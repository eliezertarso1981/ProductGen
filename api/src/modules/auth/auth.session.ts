import { createHash, randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { AppError } from '../../shared/errors';

function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  pool: Pool,
  userId: string,
  metadata: { userAgent?: string; ip?: string },
) {
  const refreshToken = generateRefreshToken();
  const result = await pool.query<{ id: string }>(
    `INSERT INTO user_sessions (
       user_id, refresh_token_hash, user_agent, ip_address, expires_at
     )
     VALUES ($1, $2, $3, NULLIF($4, '')::inet, now() + interval '30 days')
     RETURNING id`,
    [userId, hashRefreshToken(refreshToken), metadata.userAgent ?? null, metadata.ip ?? null],
  );

  return { id: result.rows[0].id, refreshToken };
}

export async function rotateRefreshToken(pool: Pool, refreshToken: string) {
  const currentHash = hashRefreshToken(refreshToken);
  const sessionResult = await pool.query<{
    id: string;
    user_id: string;
    revoked_at: string | null;
    expires_at: string;
  }>(
    `SELECT id, user_id, revoked_at, expires_at
     FROM user_sessions
     WHERE refresh_token_hash = $1`,
    [currentHash],
  );
  const session = sessionResult.rows[0];
  if (!session) throw new AppError(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada');

  if (session.revoked_at) {
    await revokeAllSessionsService(pool, session.user_id);
    throw new AppError(401, 'REFRESH_TOKEN_REUSED', 'Sessão revogada por possível comprometimento');
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await revokeSessionService(pool, session.id);
    throw new AppError(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada');
  }

  const nextRefreshToken = generateRefreshToken();
  await pool.query(
    `UPDATE user_sessions
     SET refresh_token_hash = $2,
         expires_at = now() + interval '30 days',
         last_used_at = now()
     WHERE id = $1`,
    [session.id, hashRefreshToken(nextRefreshToken)],
  );

  return { id: session.id, userId: session.user_id, refreshToken: nextRefreshToken };
}

export async function revokeSessionService(pool: Pool, sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = COALESCE(revoked_at, now()), revoked_reason = COALESCE(revoked_reason, 'logout')
     WHERE id = $1`,
    [sessionId],
  );
}

export async function revokeAllSessionsService(pool: Pool, userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_sessions
     SET revoked_at = COALESCE(revoked_at, now()), revoked_reason = COALESCE(revoked_reason, 'logout_all')
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
