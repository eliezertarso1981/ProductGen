import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { outcomeRouteSchemas } from '../../docs/route-docs';
import {
  createOutcomeSchema,
  updateOutcomeSchema,
  updateOutcomeStatusSchema,
} from './outcomes.schemas';
import * as service from './outcomes.service';

export async function outcomesRoutes(app: FastifyInstance) {
  app.get<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/outcomes',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.list },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const outcomes = await service.listOutcomesByRoadmapItem(
        workspace_id,
        user_id,
        roadmap_item_id,
      );
      return reply.send(outcomes);
    },
  );

  app.post<{ Params: { roadmap_item_id: string } }>(
    '/roadmap/:roadmap_item_id/outcomes',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.create },
    async (request, reply) => {
      const { roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createOutcomeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const outcome = await service.createOutcome(
        workspace_id,
        user_id,
        roadmap_item_id,
        parsed.data,
      );
      return reply.status(201).send(outcome);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/outcomes/:id',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const outcome = await service.getOutcome(workspace_id, user_id, id);
      return reply.send(outcome);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/outcomes/:id',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateOutcomeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const outcome = await service.updateOutcome(workspace_id, user_id, id, parsed.data);
      return reply.send(outcome);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/outcomes/:id/status',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateOutcomeStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const outcome = await service.transitionOutcomeStatus(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(outcome);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/outcomes/:id',
    { preHandler: requireAuth, schema: outcomeRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteOutcome(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
