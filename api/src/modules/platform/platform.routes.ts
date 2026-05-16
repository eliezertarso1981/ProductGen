import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { platformRouteSchemas } from '../../docs/route-docs';
import {
  attachAssetSchema,
  createAssignmentSchema,
  createCommentSchema,
  createDecisionLogSchema,
  createMediaAssetSchema,
  entityParamsSchema,
} from './platform.schemas';
import * as service from './platform.service';

export async function platformRoutes(app: FastifyInstance) {
  app.get<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/comments',
    { preHandler: requireAuth, schema: platformRouteSchemas.listComments },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const comments = await service.listComments(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
      );
      return reply.send(comments);
    },
  );

  app.post<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/comments',
    { preHandler: requireAuth, schema: platformRouteSchemas.createComment },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const parsed = createCommentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const comment = await service.createComment(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
        parsed.data,
      );
      return reply.status(201).send(comment);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/comments/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.deleteComment },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      await service.deleteComment(workspace_id, user_id, request.params.id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/assignments',
    { preHandler: requireAuth, schema: platformRouteSchemas.listAssignments },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const assignments = await service.listAssignments(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
      );
      return reply.send(assignments);
    },
  );

  app.post<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/assignments',
    { preHandler: requireAuth, schema: platformRouteSchemas.createAssignment },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const parsed = createAssignmentSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const assignment = await service.createAssignment(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
        parsed.data,
      );
      return reply.status(201).send(assignment);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/entity-assignments/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.closeAssignment },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      await service.closeAssignment(workspace_id, user_id, request.params.id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/decision-logs',
    { preHandler: requireAuth, schema: platformRouteSchemas.listDecisionLogs },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const decisions = await service.listDecisionLogs(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
      );
      return reply.send(decisions);
    },
  );

  app.post<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/decision-logs',
    { preHandler: requireAuth, schema: platformRouteSchemas.createDecisionLog },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const parsed = createDecisionLogSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const decision = await service.createDecisionLog(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
        parsed.data,
      );
      return reply.status(201).send(decision);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/decision-logs/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.deleteDecisionLog },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      await service.deleteDecisionLog(workspace_id, user_id, request.params.id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/events',
    { preHandler: requireAuth, schema: platformRouteSchemas.listEvents },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const events = await service.listEntityEvents(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
      );
      return reply.send(events);
    },
  );

  app.get(
    '/media-assets',
    { preHandler: requireAuth, schema: platformRouteSchemas.listMediaAssets },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      const assets = await service.listMediaAssets(workspace_id, user_id);
      return reply.send(assets);
    },
  );

  app.post(
    '/media-assets',
    { preHandler: requireAuth, schema: platformRouteSchemas.createMediaAsset },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      const parsed = createMediaAssetSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const asset = await service.createMediaAsset(workspace_id, user_id, parsed.data);
      return reply.status(201).send(asset);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/media-assets/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.getMediaAsset },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      const asset = await service.getMediaAsset(workspace_id, user_id, request.params.id);
      return reply.send(asset);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/media-assets/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.deleteMediaAsset },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      await service.deleteMediaAsset(workspace_id, user_id, request.params.id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/assets',
    { preHandler: requireAuth, schema: platformRouteSchemas.listEntityAssets },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const assets = await service.listAssetAttachments(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
      );
      return reply.send(assets);
    },
  );

  app.post<{ Params: { entity_type: string; entity_id: string } }>(
    '/entities/:entity_type/:entity_id/assets',
    { preHandler: requireAuth, schema: platformRouteSchemas.attachAsset },
    async (request, reply) => {
      const params = parseEntityParams(request.params);
      const { workspace_id, user_id } = request.user;
      const parsed = attachAssetSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const attachment = await service.attachAssetToEntity(
        workspace_id,
        user_id,
        params.entity_type,
        params.entity_id,
        parsed.data,
      );
      return reply.status(201).send(attachment);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/entity-assets/:id',
    { preHandler: requireAuth, schema: platformRouteSchemas.detachAsset },
    async (request, reply) => {
      const { workspace_id, user_id } = request.user;
      await service.detachAsset(workspace_id, user_id, request.params.id);
      return reply.status(204).send();
    },
  );
}

function parseEntityParams(params: { entity_type: string; entity_id: string }) {
  const parsed = entityParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
  }
  return parsed.data;
}

