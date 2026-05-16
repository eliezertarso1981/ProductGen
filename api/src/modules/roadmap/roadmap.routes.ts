import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { roadmapRouteSchemas } from '../../docs/route-docs';
import {
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  updateStatusSchema,
} from './roadmap.schemas';
import * as service from './roadmap.service';

export async function roadmapRoutes(app: FastifyInstance) {
  // GET /products/:product_id/roadmap
  // Lista todos os itens do roadmap; ordenados por path ltree.
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/roadmap',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const items = await service.listRoadmapItems(workspace_id, user_id, product_id);
      return reply.send(items);
    },
  );

  // POST /products/:product_id/roadmap
  // Cria um novo item; se parent_id informado, o path e construido automaticamente.
  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/roadmap',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createRoadmapItemSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const item = await service.createRoadmapItem(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(item);
    },
  );

  // GET /roadmap/:id
  app.get<{ Params: { id: string } }>(
    '/roadmap/:id',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const item = await service.getRoadmapItem(workspace_id, user_id, id);
      return reply.send(item);
    },
  );

  // PATCH /roadmap/:id
  app.patch<{ Params: { id: string } }>(
    '/roadmap/:id',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateRoadmapItemSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const item = await service.updateRoadmapItem(workspace_id, user_id, id, parsed.data);
      return reply.send(item);
    },
  );

  // PATCH /roadmap/:id/status
  // O banco valida lifecycle e regras de planned para initiative/epic.
  app.patch<{ Params: { id: string } }>(
    '/roadmap/:id/status',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const item = await service.transitionRoadmapStatus(workspace_id, user_id, id, parsed.data);
      return reply.send(item);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/roadmap/:id/scoring',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.updateScoring },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      let parsed;
      try {
        parsed = service.parseScoringInput(request.body);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payload inválido';
        throw new AppError(400, 'VALIDATION_ERROR', message);
      }

      const item = await service.updateRoadmapScoring(workspace_id, user_id, id, parsed);
      return reply.send(item);
    },
  );

  // DELETE /roadmap/:id
  app.delete<{ Params: { id: string } }>(
    '/roadmap/:id',
    { preHandler: requireAuth, schema: roadmapRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteRoadmapItem(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
