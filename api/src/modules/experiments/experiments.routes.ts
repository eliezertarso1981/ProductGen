import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { experimentRouteSchemas } from '../../docs/route-docs';
import {
  createExperimentSchema,
  updateExperimentSchema,
  updateExperimentStatusSchema,
} from './experiments.schemas';
import * as service from './experiments.service';

export async function experimentsRoutes(app: FastifyInstance) {
  app.get<{ Params: { hypothesis_id: string } }>(
    '/hypotheses/:hypothesis_id/experiments',
    { preHandler: requireAuth, schema: experimentRouteSchemas.list },
    async (request, reply) => {
      const { hypothesis_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const experiments = await service.listExperimentsByHypothesis(
        workspace_id,
        user_id,
        hypothesis_id,
      );
      return reply.send(experiments);
    },
  );

  app.post<{ Params: { hypothesis_id: string } }>(
    '/hypotheses/:hypothesis_id/experiments',
    { preHandler: requireAuth, schema: experimentRouteSchemas.create },
    async (request, reply) => {
      const { hypothesis_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createExperimentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const experiment = await service.createExperiment(
        workspace_id,
        user_id,
        hypothesis_id,
        parsed.data,
      );
      return reply.status(201).send(experiment);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/experiments/:id',
    { preHandler: requireAuth, schema: experimentRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const experiment = await service.getExperiment(workspace_id, user_id, id);
      return reply.send(experiment);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/experiments/:id',
    { preHandler: requireAuth, schema: experimentRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateExperimentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const experiment = await service.updateExperiment(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(experiment);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/experiments/:id/status',
    { preHandler: requireAuth, schema: experimentRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateExperimentStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const experiment = await service.transitionExperimentStatus(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(experiment);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/experiments/:id',
    { preHandler: requireAuth, schema: experimentRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteExperiment(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
