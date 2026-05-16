import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { AppError } from '../../shared/errors';
import { painRouteSchemas } from '../../docs/route-docs';
import {
  createPainSchema,
  updatePainSchema,
  updateStatusSchema,
  mergePainsSchema,
  splitPainSchema,
} from './pains.schemas';
import * as service from './pains.service';

export async function painsRoutes(app: FastifyInstance) {
  // GET /products/:product_id/pains
  // Lista todas as dores de um produto (do workspace do usuario logado)
  app.get<{ Params: { product_id: string } }>(
    '/products/:product_id/pains',
    { preHandler: requireAuth, schema: painRouteSchemas.list },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const pains = await service.listPains(workspace_id, user_id, product_id);
      return reply.send(pains);
    },
  );

  // POST /products/:product_id/pains
  // Cria uma nova dor; retorna 201 com o objeto criado
  app.post<{ Params: { product_id: string } }>(
    '/products/:product_id/pains',
    { preHandler: requireAuth, schema: painRouteSchemas.create },
    async (request, reply) => {
      const { product_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = createPainSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pain = await service.createPain(workspace_id, user_id, product_id, parsed.data);
      return reply.status(201).send(pain);
    },
  );

  // GET /pains/:id
  // Busca uma dor pelo id
  app.get<{ Params: { id: string } }>(
    '/pains/:id',
    { preHandler: requireAuth, schema: painRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const pain = await service.getPain(workspace_id, user_id, id);
      return reply.send(pain);
    },
  );

  // PATCH /pains/:id
  // Atualiza campos gerais (titulo, descricao, severidade, etc.)
  app.patch<{ Params: { id: string } }>(
    '/pains/:id',
    { preHandler: requireAuth, schema: painRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updatePainSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pain = await service.updatePain(workspace_id, user_id, id, parsed.data);
      return reply.send(pain);
    },
  );

  // PATCH /pains/:id/status
  // Faz uma transicao de status; o banco valida se a transicao e permitida.
  app.patch<{ Params: { id: string } }>(
    '/pains/:id/status',
    { preHandler: requireAuth, schema: painRouteSchemas.transitionStatus },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = updateStatusSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pain = await service.transitionPainStatus(workspace_id, user_id, id, parsed.data);
      return reply.send(pain);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/pains/:id/scoring',
    { preHandler: requireAuth, schema: painRouteSchemas.updateScoring },
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

      const pain = await service.updatePainScoring(workspace_id, user_id, id, parsed);
      return reply.send(pain);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/pains/:id/merge',
    { preHandler: requireAuth, schema: painRouteSchemas.merge },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = mergePainsSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const pain = await service.mergePains(workspace_id, user_id, id, parsed.data);
      return reply.send(pain);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/pains/:id/split',
    { preHandler: requireAuth, schema: painRouteSchemas.split },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const parsed = splitPainSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const children = await service.splitPain(workspace_id, user_id, id, parsed.data);
      return reply.status(201).send(children);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/pains/:id/relationships',
    { preHandler: requireAuth, schema: painRouteSchemas.listRelationships },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const relationships = await service.listPainRelationships(workspace_id, user_id, id);
      return reply.send(relationships);
    },
  );

  // DELETE /pains/:id
  // Soft delete: seta deleted_at, nao apaga o registro
  app.delete<{ Params: { id: string } }>(
    '/pains/:id',
    { preHandler: requireAuth, schema: painRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.deletePain(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );
}
