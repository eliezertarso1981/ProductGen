import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { productRouteSchemas } from '../../docs/route-docs';
import {
  createProductSchema,
  updateProductSchema,
} from './products.schemas';
import * as service from './products.service';

export async function productsRoutes(app: FastifyInstance) {
  // GET /workspaces/:workspace_id/products
  app.get<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/products',
    { preHandler: requireAuth, schema: productRouteSchemas.list },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;

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

      await service.deleteProduct(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
