import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { handoffRouteSchemas } from '../../docs/route-docs';
import { createHandoffSchema, updateHandoffSchema } from './engineering-handoffs.schemas';
import * as service from './engineering-handoffs.service';

export async function engineeringHandoffsRoutes(app: FastifyInstance) {
  app.get<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/engineering-handoffs',
    { preHandler: requireAuth, schema: handoffRouteSchemas.list },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;
      const handoffs = await service.listHandoffsByRoadmapItem(
        workspace_id,
        user_id,
        roadmap_item_id,
      );
      return reply.send(handoffs);
    },
  );

  app.post<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/engineering-handoffs',
    { preHandler: requireAuth, schema: handoffRouteSchemas.create },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createHandoffSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const handoff = await service.createHandoff(
        workspace_id,
        user_id,
        roadmap_item_id,
        parsed.data,
      );
      return reply.status(201).send(handoff);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/engineering-handoffs/:id',
    { preHandler: requireAuth, schema: handoffRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      const handoff = await service.getHandoff(workspace_id, user_id, id);
      return reply.send(handoff);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/engineering-handoffs/:id',
    { preHandler: requireAuth, schema: handoffRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateHandoffSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const handoff = await service.updateHandoff(workspace_id, user_id, id, parsed.data);
      return reply.send(handoff);
    },
  );
}
