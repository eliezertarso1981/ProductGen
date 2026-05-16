import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { releaseRouteSchemas } from '../../docs/route-docs';
import { createReleaseSchema, updateReleaseSchema } from './releases.schemas';
import * as service from './releases.service';

export async function releasesRoutes(app: FastifyInstance) {
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/releases',
    { preHandler: requireAuth, schema: releaseRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;
      const releases = await service.listReleasesByProduct(workspace_id, user_id, product_id);
      return reply.send(releases);
    },
  );

  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/releases',
    { preHandler: requireAuth, schema: releaseRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createReleaseSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const release = await service.createRelease(
        workspace_id,
        user_id,
        product_id,
        parsed.data,
      );
      return reply.status(201).send(release);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/releases/:id',
    { preHandler: requireAuth, schema: releaseRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      const release = await service.getRelease(workspace_id, user_id, id);
      return reply.send(release);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/releases/:id',
    { preHandler: requireAuth, schema: releaseRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateReleaseSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const release = await service.updateRelease(workspace_id, user_id, id, parsed.data);
      return reply.send(release);
    },
  );
}
