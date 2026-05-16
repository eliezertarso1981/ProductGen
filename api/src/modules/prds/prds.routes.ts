import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { prdRouteSchemas } from '../../docs/route-docs';
import { createPrdSchema, updatePrdSchema, updatePrdStatusSchema } from './prds.schemas';
import * as service from './prds.service';

export async function prdsRoutes(app: FastifyInstance) {
  app.get<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/prds',
    { preHandler: requireAuth, schema: prdRouteSchemas.list },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;
      const prds = await service.listPrdsByRoadmapItem(workspace_id, user_id, roadmap_item_id);
      return reply.send(prds);
    },
  );

  app.post<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/prds',
    { preHandler: requireAuth, schema: prdRouteSchemas.create },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createPrdSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const prd = await service.createPrd(workspace_id, user_id, roadmap_item_id, parsed.data);
      return reply.status(201).send(prd);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/prds/:id',
    { preHandler: requireAuth, schema: prdRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      const prd = await service.getPrd(workspace_id, user_id, id);
      return reply.send(prd);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/prds/:id',
    { preHandler: requireAuth, schema: prdRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updatePrdSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const prd = await service.updatePrd(workspace_id, user_id, id, parsed.data);
      return reply.send(prd);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/prds/:id/status',
    { preHandler: requireAuth, schema: prdRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updatePrdStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const prd = await service.transitionPrdStatus(workspace_id, user_id, id, parsed.data);
      return reply.send(prd);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/prds/:id',
    { preHandler: requireAuth, schema: prdRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await service.deletePrd(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
