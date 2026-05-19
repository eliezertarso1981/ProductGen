import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './jwt';
import { pool } from '../db/pool';
import {
  getWorkspaceMembership,
  listUserWorkspaces,
  markWorkspaceAccessed,
} from '../modules/auth/auth.service';
import { getEffectivePermissions } from './permissions';

// Use como preHandler nas rotas que precisam de autenticação:
//   app.get('/rota', { preHandler: requireAuth }, handler)
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const cookieToken = request.cookies?.pg_access;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearerToken ?? cookieToken;

  if (!token) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Token não informado' },
    });
  }

  try {
    const payload = await verifyAccessToken(token);
    const sessionResult = await pool.query<{ id: string }>(
      `SELECT id
       FROM user_sessions
       WHERE id = $1
         AND user_id = $2
         AND revoked_at IS NULL
         AND expires_at > now()`,
      [payload.session_id, payload.user_id],
    );
    if (!sessionResult.rows[0]) throw new Error('Invalid session');

    const workspace = await resolveActiveWorkspace(request, payload.user_id);
    if (!workspace) {
      return reply.status(403).send({
        error: { code: 'WORKSPACE_REQUIRED', message: 'Workspace ativo não encontrado' },
      });
    }

    request.user = {
      ...payload,
      workspace_id: workspace.id,
      role: workspace.role,
    };
    request.permissions = new Set(
      await getEffectivePermissions(pool, payload.user_id, { workspaceId: workspace.id }),
    );
  } catch {
    return reply.status(401).send({
      error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' },
    });
  }
}

async function resolveActiveWorkspace(request: FastifyRequest, userId: string) {
  const headerWorkspaceId = request.headers['x-workspace-id'];
  const requestedWorkspaceId = Array.isArray(headerWorkspaceId)
    ? headerWorkspaceId[0]
    : headerWorkspaceId;
  const cookieWorkspaceId = request.cookies?.pg_workspace;
  const workspaceId = requestedWorkspaceId ?? cookieWorkspaceId;

  if (workspaceId) {
    const membership = await getWorkspaceMembership(pool, workspaceId, userId);
    if (membership) {
      await markWorkspaceAccessed(pool, membership.id, userId);
    }
    return membership;
  }

  const [defaultWorkspace] = await listUserWorkspaces(pool, userId);
  if (defaultWorkspace) {
    await markWorkspaceAccessed(pool, defaultWorkspace.id, userId);
  }
  return defaultWorkspace ?? null;
}
