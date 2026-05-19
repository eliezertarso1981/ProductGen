import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { productRouteSchemas } from '../../docs/route-docs';
import {
  createProductSchema,
  updateProductSchema,
} from './products.schemas';
import * as service from './products.service';
import { pool } from '../../db/pool';
import {
  assertProductPermission,
  assertWorkspacePermission,
} from '../../auth/permissions';

export async function productsRoutes(app: FastifyInstance) {
  // GET /workspaces/:workspace_id/products
  app.get<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/products',
    { preHandler: requireAuth, schema: productRouteSchemas.list },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      if (workspace_id !== request.user.workspace_id) {
        throw new AppError(403, 'FORBIDDEN', 'Workspace ativo inválido');
      }
      await assertWorkspacePermission(pool, request, workspace_id, 'product.read');

      const products = await service.listProducts(workspace_id, user_id);
      return reply.send(products);
    },
  );

  // POST /workspaces/:workspace_id/products
  app.post<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/products',
    { preHandler: requireAuth, schema: productRouteSchemas.create },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      if (workspace_id !== request.user.workspace_id) {
        throw new AppError(403, 'FORBIDDEN', 'Workspace ativo inválido');
      }
      await assertWorkspacePermission(pool, request, workspace_id, 'product.create');

      const parsed = createProductSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const product = await service.createProduct(workspace_id, user_id, parsed.data);
      return reply.status(201).send(product);
    },
  );

  // GET /products/:id
  app.get<{ Params: { id: string } }>(
    '/products/:id',
    { preHandler: requireAuth, schema: productRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertProductPermission(pool, request, id, 'product.read');

      const product = await service.getProduct(workspace_id, user_id, id);
      return reply.send(product);
    },
  );

  // PATCH /products/:id
  app.patch<{ Params: { id: string } }>(
    '/products/:id',
    { preHandler: requireAuth, schema: productRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertProductPermission(pool, request, id, 'product.update');

      const parsed = updateProductSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const product = await service.updateProduct(workspace_id, user_id, id, parsed.data);
      return reply.send(product);
    },
  );

  // DELETE /products/:id
  app.delete<{ Params: { id: string } }>(
    '/products/:id',
    { preHandler: requireAuth, schema: productRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertProductPermission(pool, request, id, 'product.archive');

      await service.deleteProduct(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
