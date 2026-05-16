import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { keyResultRouteSchemas } from '../../docs/route-docs';
import { createKeyResultSchema, updateKeyResultSchema } from './key-results.schemas';
import * as service from './key-results.service';

export async function keyResultsRoutes(app: FastifyInstance) {
  app.get<{ Params: { objective_id: string } }>(
    '/objectives/:objective_id/key-results',
    { preHandler: requireAuth, schema: keyResultRouteSchemas.list },
    async (request, reply) => {
      const { objective_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const keyResults = await service.listKeyResultsByObjective(
        workspace_id,
        user_id,
        objective_id,
      );
      return reply.send(keyResults);
    },
  );

  app.post<{ Params: { objective_id: string } }>(
    '/objectives/:objective_id/key-results',
    { preHandler: requireAuth, schema: keyResultRouteSchemas.create },
    async (request, reply) => {
      const { objective_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createKeyResultSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const keyResult = await service.createKeyResult(
        workspace_id,
        user_id,
        objective_id,
        parsed.data,
      );
      return reply.status(201).send(keyResult);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/key-results/:id',
    { preHandler: requireAuth, schema: keyResultRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const keyResult = await service.getKeyResult(workspace_id, user_id, id);
      return reply.send(keyResult);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/key-results/:id',
    { preHandler: requireAuth, schema: keyResultRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateKeyResultSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const keyResult = await service.updateKeyResult(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(keyResult);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/key-results/:id',
    { preHandler: requireAuth, schema: keyResultRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteKeyResult(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
