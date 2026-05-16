import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { insightRouteSchemas } from '../../docs/route-docs';
import { createInsightSchema, updateInsightSchema } from './insights.schemas';
import * as service from './insights.service';

export async function insightsRoutes(app: FastifyInstance) {
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/insights',
    { preHandler: requireAuth, schema: insightRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const insights = await service.listInsightsByProduct(workspace_id, user_id, product_id);
      return reply.send(insights);
    },
  );

  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/insights',
    { preHandler: requireAuth, schema: insightRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createInsightSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const insight = await service.createInsight(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(insight);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/insights/:id',
    { preHandler: requireAuth, schema: insightRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const insight = await service.getInsight(workspace_id, user_id, id);
      return reply.send(insight);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/insights/:id',
    { preHandler: requireAuth, schema: insightRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateInsightSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const insight = await service.updateInsight(workspace_id, user_id, id, parsed.data);
      return reply.send(insight);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/insights/:id',
    { preHandler: requireAuth, schema: insightRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deleteInsight(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { id: string } }>(
    '/insights/:id/evidences',
    { preHandler: requireAuth, schema: insightRouteSchemas.listEvidences },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const evidences = await service.listInsightEvidences(workspace_id, user_id, id);
      return reply.send(evidences);
    },
  );

  app.post<{ Params: { id: string; evidence_id: string } }>(
    '/insights/:id/evidences/:evidence_id',
    { preHandler: requireAuth, schema: insightRouteSchemas.linkEvidence },
    async (request, reply) => {
      const { id, evidence_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkEvidenceToInsight(workspace_id, user_id, id, evidence_id);
      return reply.status(201).send({ insight_id: id, evidence_id });
    },
  );

  app.delete<{ Params: { id: string; evidence_id: string } }>(
    '/insights/:id/evidences/:evidence_id',
    { preHandler: requireAuth, schema: insightRouteSchemas.unlinkEvidence },
    async (request, reply) => {
      const { id, evidence_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkEvidenceFromInsight(workspace_id, user_id, id, evidence_id);
      return reply.status(204).send();
    },
  );
}
