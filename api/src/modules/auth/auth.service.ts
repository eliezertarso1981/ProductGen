import { Pool } from 'pg';
import { createHash, randomBytes } from 'node:crypto';
import { LoginInput } from './auth.schemas';
import { signAccessToken } from '../../auth/jwt';
import { IdentityProvider, LocalIdentityProvider } from './identity-provider';
import { AppError } from '../../shared/errors';

export interface AuthSessionResult {
  token: string;
  refresh_token: string;
  user: { id: string; name: string; email: string; email_verified_at: string | null };
  workspace: { id: string; slug: string; name: string; role: string } | null;
  workspaces: Array<{ id: string; slug: string; name: string; role: string }>;
}

export async function loginService(
  pool: Pool,
  input: LoginInput,
  metadata: { userAgent?: string; ip?: string } = {},
  identityProvider: IdentityProvider = new LocalIdentityProvider(pool),
): Promise<AuthSessionResult> {
  const identity = await identityProvider.authenticate({
    email: input.email,
    password: input.password,
  });

  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [identity.user.id]);
  const session = await createSession(pool, identity.user.id, metadata);
  const workspaces = await listUserWorkspaces(pool, identity.user.id);
  const workspace = workspaces[0] ?? null;

  if (workspace) {
    await markWorkspaceAccessed(pool, workspace.id, identity.user.id);
  }

  return {
    token: await signAccessToken({
      user_id: identity.user.id,
      email: identity.user.email,
      session_id: session.id,
    }),
    refresh_token: session.refreshToken,
    user: identity.user,
    workspace,
    workspaces,
  };
}

export async function refreshSessionService(
  pool: Pool,
  refreshToken: string,
): Promise<AuthSessionResult> {
  const session = await rotateRefreshToken(pool, refreshToken);
  const userResult = await pool.query<{
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
  }>(
    `SELECT id, name, email, email_verified_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [session.userId],
  );
  const user = userResult.rows[0];
  if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada');

  const workspaces = await listUserWorkspaces(pool, user.id);
  const workspace = workspaces[0] ?? null;

  return {
    token: await signAccessToken({
      user_id: user.id,
      email: user.email,
      session_id: session.id,
    }),
    refresh_token: session.refreshToken,
    user,
    workspace,
    workspaces,
  };
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

export async function listUserWorkspaces(pool: Pool, userId: string) {
  const result = await pool.query<{ id: string; slug: string; name: string; role: string }>(
    `SELECT w.id, w.slug, w.name, wm.role
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.user_id = $1
       AND wm.removed_at IS NULL
       AND w.deleted_at IS NULL
     ORDER BY wm.last_accessed_at DESC NULLS LAST, wm.joined_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function markWorkspaceAccessed(
  pool: Pool,
  workspaceId: string,
  userId: string,
): Promise<void> {
  await pool.query(
    `UPDATE workspace_members
     SET last_accessed_at = now()
     WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [workspaceId, userId],
  );
}

export async function getWorkspaceMembership(pool: Pool, workspaceId: string, userId: string) {
  const result = await pool.query<{ id: string; slug: string; name: string; role: string }>(
    `SELECT w.id, w.slug, w.name, wm.role
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE wm.workspace_id = $1
       AND wm.user_id = $2
       AND wm.removed_at IS NULL
       AND w.deleted_at IS NULL`,
    [workspaceId, userId],
  );
  return result.rows[0] ?? null;
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function createSession(
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

async function rotateRefreshToken(pool: Pool, refreshToken: string) {
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
