import { Pool } from 'pg';
import { LoginInput } from './auth.schemas';
import { signAccessToken } from '../../auth/jwt';
import { IdentityProvider, LocalIdentityProvider } from './identity-provider';
import { AppError } from '../../shared/errors';
import {
  createSession,
  rotateRefreshToken,
} from './auth.session';

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

export { revokeSessionService, revokeAllSessionsService } from './auth.session';

export async function listUserWorkspaces(pool: Pool, userId: string) {
  const result = await pool.query<{
    id: string;
    slug: string;
    name: string;
    role: string;
    onboarded_at: string | null;
    plan: string;
  }>(
    `SELECT w.id, w.slug, w.name, wm.role, wm.onboarded_at, w.plan
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

