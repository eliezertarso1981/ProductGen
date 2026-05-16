import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { hypothesisRouteSchemas } from '../../docs/route-docs';
import {
  createHypothesisSchema,
  updateHypothesisSchema,
  updateStatusSchema,
} from './hypotheses.schemas';
import * as service from './hypotheses.service';

export async function hypothesesRoutes(app: FastifyInstance) {
  // GET /products/:product_id/hypotheses
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/hypotheses',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const hypotheses = await service.listHypotheses(workspace_id, user_id, product_id);
      return reply.send(hypotheses);
    },
  );

  // POST /products/:product_id/hypotheses
  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/hypotheses',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createHypothesisSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const hypothesis = await service.createHypothesis(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(hypothesis);
    },
  );

  // GET /hypotheses/:id
  app.get<{ Params: { id: string } }>(
    '/hypotheses/:id',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const hypothesis = await service.getHypothesis(workspace_id, user_id, id);
      return reply.send(hypothesis);
    },
  );

  // PATCH /hypotheses/:id
  app.patch<{ Params: { id: string } }>(
    '/hypotheses/:id',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateHypothesisSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const hypothesis = await service.updateHypothesis(workspace_id, user_id, id, parsed.data);
      return reply.send(hypothesis);
    },
  );

  // PATCH /hypotheses/:id/status
  // O banco valida transicoes permitidas e pre-requisitos.
  app.patch<{ Params: { id: string } }>(
    '/hypotheses/:id/status',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const hypothesis = await service.transitionHypothesisStatus(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(hypothesis);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/hypotheses/:id/scoring',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.updateScoring },
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

      const hypothesis = await service.updateHypothesisScoring(
        workspace_id,
        user_id,
        id,
        parsed,
      );
      return reply.send(hypothesis);
    },
  );

  // POST /hypotheses/:id/clone
  // Cria uma copia em formulated com cloned_from_id apontando para a original.
  app.post<{ Params: { id: string } }>(
    '/hypotheses/:id/clone',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.clone },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const clone = await service.cloneHypothesis(workspace_id, user_id, id);
      return reply.status(201).send(clone);
    },
  );

  // DELETE /hypotheses/:id
  app.delete<{ Params: { id: string } }>(
    '/hypotheses/:id',
    { preHandler: requireAuth, schema: hypothesisRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteHypothesis(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
