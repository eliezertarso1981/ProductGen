import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { workspaceMemberRouteSchemas } from '../../docs/route-docs';
import {
  createWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
} from './workspace-members.schemas';
import * as service from './workspace-members.service';

export async function workspaceMembersRoutes(app: FastifyInstance) {
  // GET /workspaces/:workspace_id/members
  app.get<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/members',
    { preHandler: requireAuth, schema: workspaceMemberRouteSchemas.list },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;

      const members = await service.listMembers(workspace_id, user_id);
      return reply.send(members);
    },
  );

  // POST /workspaces/:workspace_id/members
  app.post<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/members',
    { preHandler: requireAuth, schema: workspaceMemberRouteSchemas.create },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;

      const parsed = createWorkspaceMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const member = await service.createMember(workspace_id, user_id, parsed.data);
      return reply.status(201).send(member);
    },
  );

  // GET /workspaces/:workspace_id/members/:user_id
  app.get<{ Params: { workspace_id: string; user_id: string } }>(
    '/workspaces/:workspace_id/members/:user_id',
    { preHandler: requireAuth, schema: workspaceMemberRouteSchemas.get },
    async (request, reply) => {
      const { workspace_id, user_id } = request.params;
      const { user_id: actorId } = request.user;

      const member = await service.getMember(workspace_id, actorId, user_id);
      return reply.send(member);
    },
  );

  // PATCH /workspaces/:workspace_id/members/:user_id
  app.patch<{ Params: { workspace_id: string; user_id: string } }>(
    '/workspaces/:workspace_id/members/:user_id',
    { preHandler: requireAuth, schema: workspaceMemberRouteSchemas.update },
    async (request, reply) => {
      const { workspace_id, user_id } = request.params;
      const { user_id: actorId } = request.user;

      const parsed = updateWorkspaceMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const member = await service.updateMemberRole(workspace_id, actorId, user_id, parsed.data);
      return reply.send(member);
    },
  );

  // DELETE /workspaces/:workspace_id/members/:user_id
  app.delete<{ Params: { workspace_id: string; user_id: string } }>(
    '/workspaces/:workspace_id/members/:user_id',
    { preHandler: requireAuth, schema: workspaceMemberRouteSchemas.delete },
    async (request, reply) => {
      const { workspace_id, user_id } = request.params;
      const { user_id: actorId } = request.user;

      await service.deleteMember(workspace_id, actorId, user_id);
      return reply.status(204).send();
    },
  );
}
