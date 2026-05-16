import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { linkRouteSchemas } from '../../docs/route-docs';
import * as service from './links.service';

export async function linksRoutes(app: FastifyInstance) {
  app.get<{ Params: { pain_id: string } }>(
    '/pains/:pain_id/hypotheses',
    { preHandler: requireAuth, schema: linkRouteSchemas.listPainHypotheses },
    async (request, reply) => {
      const { pain_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const rows = await service.listPainHypotheses(workspace_id, user_id, pain_id);
      return reply.send(rows);
    },
  );

  app.post<{ Params: { pain_id: string; hypothesis_id: string } }>(
    '/pains/:pain_id/hypotheses/:hypothesis_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.linkPainHypothesis },
    async (request, reply) => {
      const { pain_id, hypothesis_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkPainHypothesis(workspace_id, user_id, pain_id, hypothesis_id);
      return reply.status(201).send({ pain_id, hypothesis_id });
    },
  );

  app.delete<{ Params: { pain_id: string; hypothesis_id: string } }>(
    '/pains/:pain_id/hypotheses/:hypothesis_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.unlinkPainHypothesis },
    async (request, reply) => {
      const { pain_id, hypothesis_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkPainHypothesis(workspace_id, user_id, pain_id, hypothesis_id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { hypothesis_id: string } }>(
    '/hypotheses/:hypothesis_id/roadmap',
    { preHandler: requireAuth, schema: linkRouteSchemas.listHypothesisRoadmap },
    async (request, reply) => {
      const { hypothesis_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const rows = await service.listHypothesisRoadmap(workspace_id, user_id, hypothesis_id);
      return reply.send(rows);
    },
  );

  app.post<{ Params: { hypothesis_id: string; roadmap_item_id: string } }>(
    '/hypotheses/:hypothesis_id/roadmap/:roadmap_item_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.linkHypothesisRoadmap },
    async (request, reply) => {
      const { hypothesis_id, roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkHypothesisRoadmap(
        workspace_id,
        user_id,
        hypothesis_id,
        roadmap_item_id,
      );
      return reply.status(201).send({ hypothesis_id, roadmap_item_id });
    },
  );

  app.delete<{ Params: { hypothesis_id: string; roadmap_item_id: string } }>(
    '/hypotheses/:hypothesis_id/roadmap/:roadmap_item_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.unlinkHypothesisRoadmap },
    async (request, reply) => {
      const { hypothesis_id, roadmap_item_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkHypothesisRoadmap(
        workspace_id,
        user_id,
        hypothesis_id,
        roadmap_item_id,
      );
      return reply.status(204).send();
    },
  );
}
