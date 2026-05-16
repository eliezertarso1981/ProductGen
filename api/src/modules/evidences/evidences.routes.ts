import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { evidenceRouteSchemas } from '../../docs/route-docs';
import {
  createEvidenceSchema,
  updateEvidenceSchema,
  updateEvidenceStatusSchema,
} from './evidences.schemas';
import * as service from './evidences.service';

export async function evidencesRoutes(app: FastifyInstance) {
  // GET /products/:product_id/evidences
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/evidences',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const evidences = await service.listEvidencesByProduct(workspace_id, user_id, product_id);
      return reply.send(evidences);
    },
  );

  // POST /products/:product_id/evidences
  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/evidences',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createEvidenceSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const evidence = await service.createEvidence(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(evidence);
    },
  );

  // GET /evidences/:id
  app.get<{ Params: { id: string } }>(
    '/evidences/:id',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const evidence = await service.getEvidence(workspace_id, user_id, id);
      return reply.send(evidence);
    },
  );

  // PATCH /evidences/:id
  app.patch<{ Params: { id: string } }>(
    '/evidences/:id',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateEvidenceSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const evidence = await service.updateEvidence(workspace_id, user_id, id, parsed.data);
      return reply.send(evidence);
    },
  );

  // PATCH /evidences/:id/status
  app.patch<{ Params: { id: string } }>(
    '/evidences/:id/status',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateEvidenceStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const evidence = await service.transitionEvidenceStatus(
        workspace_id,
        user_id,
        id,
        parsed.data,
      );
      return reply.send(evidence);
    },
  );

  // DELETE /evidences/:id (soft delete)
  app.delete<{ Params: { id: string } }>(
    '/evidences/:id',
    { preHandler: requireAuth, schema: evidenceRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteEvidence(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
