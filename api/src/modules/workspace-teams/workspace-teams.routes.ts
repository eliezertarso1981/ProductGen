import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { assertWorkspacePermission } from '../../auth/permissions';
import { pool } from '../../db/pool';
import { AppError } from '../../shared/errors';
import { workspaceTeamRouteSchemas } from '../../docs/route-docs';
import {
  createWorkspaceTeamSchema,
  updateWorkspaceTeamSchema,
} from './workspace-teams.schemas';
import * as service from './workspace-teams.service';

export async function workspaceTeamsRoutes(app: FastifyInstance) {
  app.get<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/teams',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.list },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.read');

      const teams = await service.listTeams(workspace_id, user_id);
      return reply.send(teams);
    },
  );

  app.post<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/teams',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.create },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const parsed = createWorkspaceTeamSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const team = await service.createTeam(workspace_id, user_id, parsed.data);
      return reply.status(201).send(team);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/teams/:id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.read');

      const team = await service.getTeam(workspace_id, user_id, id);
      return reply.send(team);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/teams/:id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const parsed = updateWorkspaceTeamSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const team = await service.updateTeam(workspace_id, user_id, id, parsed.data);
      return reply.send(team);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/teams/:id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      await service.deleteTeam(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );

  app.post<{ Params: { id: string; user_id: string } }>(
    '/teams/:id/members/:user_id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.addMember },
    async (request, reply) => {
      const { id, user_id } = request.params;
      const { workspace_id, user_id: actorId } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const team = await service.addMember(workspace_id, actorId, id, user_id);
      return reply.status(201).send(team);
    },
  );

  app.delete<{ Params: { id: string; user_id: string } }>(
    '/teams/:id/members/:user_id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.removeMember },
    async (request, reply) => {
      const { id, user_id } = request.params;
      const { workspace_id, user_id: actorId } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const team = await service.removeMember(workspace_id, actorId, id, user_id);
      return reply.send(team);
    },
  );

  app.post<{ Params: { id: string; product_id: string } }>(
    '/teams/:id/products/:product_id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.addProduct },
    async (request, reply) => {
      const { id, product_id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const team = await service.addProduct(workspace_id, user_id, id, product_id);
      return reply.status(201).send(team);
    },
  );

  app.delete<{ Params: { id: string; product_id: string } }>(
    '/teams/:id/products/:product_id',
    { preHandler: requireAuth, schema: workspaceTeamRouteSchemas.removeProduct },
    async (request, reply) => {
      const { id, product_id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'members.update_role');

      const team = await service.removeProduct(workspace_id, user_id, id, product_id);
      return reply.send(team);
    },
  );
}
