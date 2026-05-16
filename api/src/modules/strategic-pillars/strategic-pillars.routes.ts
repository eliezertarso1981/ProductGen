import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { strategicPillarRouteSchemas } from '../../docs/route-docs';
import {
  createStrategicPillarSchema,
  updateStrategicPillarSchema,
} from './strategic-pillars.schemas';
import * as service from './strategic-pillars.service';

export async function strategicPillarsRoutes(app: FastifyInstance) {
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/strategic-pillars',
    { preHandler: requireAuth, schema: strategicPillarRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const pillars = await service.listPillarsByProduct(workspace_id, user_id, product_id);
      return reply.send(pillars);
    },
  );

  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/strategic-pillars',
    { preHandler: requireAuth, schema: strategicPillarRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createStrategicPillarSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pillar = await service.createPillar(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(pillar);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/strategic-pillars/:id',
    { preHandler: requireAuth, schema: strategicPillarRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const pillar = await service.getPillar(workspace_id, user_id, id);
      return reply.send(pillar);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/strategic-pillars/:id',
    { preHandler: requireAuth, schema: strategicPillarRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateStrategicPillarSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pillar = await service.updatePillar(workspace_id, user_id, id, parsed.data);
      return reply.send(pillar);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/strategic-pillars/:id',
    { preHandler: requireAuth, schema: strategicPillarRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deletePillar(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
