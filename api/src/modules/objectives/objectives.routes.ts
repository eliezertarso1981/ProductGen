import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { objectiveRouteSchemas } from '../../docs/route-docs';
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  updateObjectiveStatusSchema,
} from './objectives.schemas';
import * as service from './objectives.service';

export async function objectivesRoutes(app: FastifyInstance) {
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/objectives',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const objectives = await service.listObjectivesByProduct(
        workspace_id,
        user_id,
        product_id,
      );
      return reply.send(objectives);
    },
  );

  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/objectives',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createObjectiveSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const objective = await service.createObjective(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(objective);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/objectives/:id',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const objective = await service.getObjective(workspace_id, user_id, id);
      return reply.send(objective);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/objectives/:id',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateObjectiveSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const objective = await service.updateObjective(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(objective);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/objectives/:id/status',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateObjectiveStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const objective = await service.transitionObjectiveStatus(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(objective);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/objectives/:id',
    { preHandler: requireAuth, schema: objectiveRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteObjective(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
