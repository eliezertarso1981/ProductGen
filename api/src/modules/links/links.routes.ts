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

  app.get<{ Params: { pain_id: string } }>(
    '/pains/:pain_id/strategic-pillars',
    { preHandler: requireAuth, schema: linkRouteSchemas.listPainStrategicPillars },
    async (request, reply) => {
      const { pain_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const rows = await service.listPainStrategicPillars(workspace_id, user_id, pain_id);
      return reply.send(rows);
    },
  );

  app.post<{ Params: { pain_id: string; pillar_id: string } }>(
    '/pains/:pain_id/strategic-pillars/:pillar_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.linkPainStrategicPillar },
    async (request, reply) => {
      const { pain_id, pillar_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkPainStrategicPillar(workspace_id, user_id, pain_id, pillar_id);
      return reply.status(201).send({ pain_id, pillar_id });
    },
  );

  app.delete<{ Params: { pain_id: string; pillar_id: string } }>(
    '/pains/:pain_id/strategic-pillars/:pillar_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.unlinkPainStrategicPillar },
    async (request, reply) => {
      const { pain_id, pillar_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkPainStrategicPillar(workspace_id, user_id, pain_id, pillar_id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { pain_id: string } }>(
    '/pains/:pain_id/objectives',
    { preHandler: requireAuth, schema: linkRouteSchemas.listPainObjectives },
    async (request, reply) => {
      const { pain_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const rows = await service.listPainObjectives(workspace_id, user_id, pain_id);
      return reply.send(rows);
    },
  );

  app.post<{ Params: { pain_id: string; objective_id: string } }>(
    '/pains/:pain_id/objectives/:objective_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.linkPainObjective },
    async (request, reply) => {
      const { pain_id, objective_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkPainObjective(workspace_id, user_id, pain_id, objective_id);
      return reply.status(201).send({ pain_id, objective_id });
    },
  );

  app.delete<{ Params: { pain_id: string; objective_id: string } }>(
    '/pains/:pain_id/objectives/:objective_id',
    { preHandler: requireAuth, schema: linkRouteSchemas.unlinkPainObjective },
    async (request, reply) => {
      const { pain_id, objective_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkPainObjective(workspace_id, user_id, pain_id, objective_id);
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
