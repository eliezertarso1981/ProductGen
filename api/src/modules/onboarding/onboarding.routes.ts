import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuthSession } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { pool } from '../../db/pool';
import { PLAN_CATALOG } from '../../config/plans';
import { config } from '../../config/env';
import {
  createWorkspaceSchema,
  enterpriseLeadSchema,
  setWorkspacePlanSchema,
  signupSchema,
  updateMeSchema,
} from './onboarding.schemas';
import { getWorkspaceMembership } from '../auth/auth.service';
import * as service from './onboarding.service';

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

function setSessionCookies(
  reply: FastifyReply,
  result: { token: string; refresh_token: string; workspace?: { id: string } | null },
) {
  reply
    .setCookie(accessCookie, result.token, { ...accessCookieOptions, maxAge: 15 * 60 })
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
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.post('/auth/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    try {
      const result = await service.signupService(pool, parsed.data, {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
      setSessionCookies(reply, result);
      return reply.status(201).send({
        token: result.token,
        user: result.user,
        workspace: result.workspace,
        workspaces: result.workspaces,
      });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Senha')) {
        throw new AppError(400, 'VALIDATION_ERROR', err.message);
      }
      throw err;
    }
  });

  app.get('/auth/email-available', async (request) => {
    const email = (request.query as { email?: string }).email?.trim().toLowerCase();
    if (!email) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Informe o parâmetro email');
    }
    const available = await service.isEmailAvailable(pool, email);
    return { available };
  });

  app.get('/auth/onboarding-status', { preHandler: requireAuthSession }, async (request) => {
    return service.getOnboardingStatus(
      pool,
      request.user.user_id,
      request.user.workspace_id || undefined,
    );
  });

  app.get('/workspaces/slug-available', { preHandler: requireAuthSession }, async (request) => {
    const slug = (request.query as { slug?: string }).slug?.trim().toLowerCase();
    if (!slug) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Informe o parâmetro slug');
    }
    const available = await service.isSlugAvailable(pool, slug);
    return { available };
  });

  app.post('/workspaces', { preHandler: requireAuthSession }, async (request, reply) => {
    const parsed = createWorkspaceSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    const workspace = await service.createWorkspaceService(pool, request.user.user_id, parsed.data);
    reply.setCookie(workspaceCookie, workspace.id, {
      ...accessCookieOptions,
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
    });

    return reply.status(201).send({ workspace });
  });

  app.patch('/users/me', { preHandler: requireAuthSession }, async (request, reply) => {
    const parsed = updateMeSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    const user = await service.updateMeService(pool, request.user.user_id, parsed.data);
    return reply.send({ user });
  });

  app.get('/plans', async () => ({ plans: PLAN_CATALOG }));

  app.patch<{ Params: { id: string } }>(
    '/workspaces/:id/plan',
    { preHandler: requireAuthSession },
    async (request, reply) => {
      const parsed = setWorkspacePlanSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const workspace = await service.setWorkspacePlanService(
        pool,
        request.user.user_id,
        request.params.id,
        parsed.data,
      );
      return reply.send({ workspace });
    },
  );

  app.post('/leads/enterprise', { preHandler: requireAuthSession }, async (request, reply) => {
    const parsed = enterpriseLeadSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    const lead = await service.createEnterpriseLeadService(pool, request.user.user_id, parsed.data);
    return reply.status(201).send({ lead });
  });

  app.post('/onboarding/complete', { preHandler: requireAuthSession }, async (request, reply) => {
    const headerWorkspaceId = request.headers['x-workspace-id'];
    const workspaceId =
      (Array.isArray(headerWorkspaceId) ? headerWorkspaceId[0] : headerWorkspaceId) ||
      request.user.workspace_id ||
      null;

    if (!workspaceId) {
      throw new AppError(403, 'WORKSPACE_REQUIRED', 'Workspace ativo não encontrado');
    }

    const membership = await getWorkspaceMembership(pool, workspaceId, request.user.user_id);
    if (!membership) {
      throw new AppError(403, 'FORBIDDEN', 'Você não pertence a este workspace');
    }

    const result = await service.completeOnboardingService(
      pool,
      request.user.user_id,
      workspaceId,
    );
    return reply.send(result);
  });
}
