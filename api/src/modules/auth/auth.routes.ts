import { FastifyInstance } from 'fastify';
import { loginSchema } from './auth.schemas';
import {
  listUserWorkspaces,
  loginService,
  refreshSessionService,
  revokeAllSessionsService,
  revokeSessionService,
} from './auth.service';
import { pool } from '../../db/pool';
import { AppError } from '../../shared/errors';
import { authRouteSchemas } from '../../docs/route-docs';
import { config } from '../../config/env';
import { requireAuthSession } from '../../auth/middleware';
import { withWorkspaceTx } from '../../db/tx';
import { getEffectivePermissions } from '../../auth/permissions';

const accessCookie = 'pg_access';
const refreshCookie = 'pg_refresh';
const workspaceCookie = 'pg_workspace';
const isProduction = config.NODE_ENV === 'production';
const sameSite = config.COOKIE_SAME_SITE;
const cookieSecure = isProduction || sameSite === 'none';

const accessCookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite,
  path: '/',
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite,
  path: '/auth/refresh',
};

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  // Body: { email: string, password: string }
  // Retorna: { token, user, workspace }
  app.post('/auth/login', { schema: authRouteSchemas.login }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    const result = await loginService(pool, parsed.data, {
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });
    reply
      .setCookie(accessCookie, result.token, {
        ...accessCookieOptions,
        maxAge: 15 * 60,
      })
      .setCookie(refreshCookie, result.refresh_token, {
        ...refreshCookieOptions,
        maxAge: 30 * 24 * 60 * 60,
      });
    if (result.workspace) {
      reply.setCookie(workspaceCookie, result.workspace.id, {
        ...accessCookieOptions,
        httpOnly: false,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return reply.status(200).send({
      token: result.token,
      user: result.user,
      workspace: result.workspace,
      workspaces: result.workspaces,
    });
  });

  app.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies[refreshCookie];
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Sessão não informada');
    }

    let result;
    try {
      result = await refreshSessionService(pool, token);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada');
    }
    reply
      .setCookie(accessCookie, result.token, {
        ...accessCookieOptions,
        maxAge: 15 * 60,
      })
      .setCookie(refreshCookie, result.refresh_token, {
        ...refreshCookieOptions,
        maxAge: 30 * 24 * 60 * 60,
      });

    return reply.status(200).send({ token: result.token });
  });

  app.post('/auth/logout', { preHandler: requireAuthSession }, async (request, reply) => {
    await revokeSessionService(pool, request.user.session_id);
    reply
      .clearCookie(accessCookie, { path: '/' })
      .clearCookie(refreshCookie, { path: '/auth/refresh' });

    return reply.status(204).send();
  });

  app.post('/auth/logout-all', { preHandler: requireAuthSession }, async (request, reply) => {
    await revokeAllSessionsService(pool, request.user.user_id);
    reply
      .clearCookie(accessCookie, { path: '/' })
      .clearCookie(refreshCookie, { path: '/auth/refresh' });

    return reply.status(204).send();
  });

  app.get('/auth/me', { preHandler: requireAuthSession }, async (request, reply) => {
    const userResult = await pool.query<{
      id: string;
      name: string;
      email: string;
      email_verified_at: string | null;
      avatar_url: string | null;
    }>(
      `SELECT id, name, email, email_verified_at, avatar_url
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [request.user.user_id],
    );
    const user = userResult.rows[0];
    if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Usuário inválido');

    const membershipRows = await listUserWorkspaces(pool, request.user.user_id);
    const workspaces = await Promise.all(
      membershipRows.map(async (workspace) => {
        const workspacePermissions = await getEffectivePermissions(pool, request.user.user_id, {
          workspaceId: workspace.id,
        });
        const products = await withWorkspaceTx(pool, workspace.id, request.user.user_id, async (client) => {
          const result = await client.query<{
            id: string;
            slug: string | null;
            name: string;
            role: string | null;
          }>(
            `SELECT p.id, p.slug, p.name, pm.role
             FROM products p
             LEFT JOIN product_members pm
               ON pm.product_id = p.id AND pm.user_id = $2
             WHERE p.workspace_id = $1
               AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC`,
            [workspace.id, request.user.user_id],
          );
          return result.rows;
        });

        const visibleProducts = workspace.role === 'guest'
          ? products.filter((product) => product.role && product.role !== 'none')
          : products.filter((product) => product.role !== 'none');

        return {
          ...workspace,
          permissions: workspacePermissions,
          products: await Promise.all(
            visibleProducts.map(async (product) => ({
              ...product,
              role: product.role ?? 'viewer',
              permissions: await getEffectivePermissions(pool, request.user.user_id, {
                workspaceId: workspace.id,
                productId: product.id,
              }),
            })),
          ),
        };
      }),
    );

    return reply.send({
      user,
      workspaces,
      current_workspace_id: request.user.workspace_id || null,
      current_product_id: request.cookies.pg_product ?? null,
    });
  });
}
