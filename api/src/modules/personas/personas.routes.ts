import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../auth/middleware';
import { assertWorkspacePermission } from '../../auth/permissions';
import { pool } from '../../db/pool';
import { AppError } from '../../shared/errors';
import { personaRouteSchemas } from '../../docs/route-docs';
import { createPersonaSchema, updatePersonaSchema } from './personas.schemas';
import * as service from './personas.service';

export async function personasRoutes(app: FastifyInstance) {
  app.get<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/personas',
    { preHandler: requireAuth, schema: personaRouteSchemas.list },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'persona.read');

      const personas = await service.listPersonas(workspace_id, user_id);
      return reply.send(personas);
    },
  );

  app.post<{ Params: { workspace_id: string } }>(
    '/workspaces/:workspace_id/personas',
    { preHandler: requireAuth, schema: personaRouteSchemas.create },
    async (request, reply) => {
      const { workspace_id } = request.params;
      const { user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'persona.create');

      const parsed = createPersonaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const persona = await service.createPersona(workspace_id, user_id, parsed.data);
      return reply.status(201).send(persona);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/personas/:id',
    { preHandler: requireAuth, schema: personaRouteSchemas.get },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;

      const persona = await service.getPersona(workspace_id, user_id, id);
      return reply.send(persona);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/personas/:id',
    { preHandler: requireAuth, schema: personaRouteSchemas.update },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'persona.update');

      const parsed = updatePersonaSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
      }

      const persona = await service.updatePersona(workspace_id, user_id, id, parsed.data);
      return reply.send(persona);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/personas/:id',
    { preHandler: requireAuth, schema: personaRouteSchemas.delete },
    async (request, reply) => {
      const { id } = request.params;
      const { workspace_id, user_id } = request.user;
      await assertWorkspacePermission(pool, request, workspace_id, 'persona.delete');

      await service.deletePersona(workspace_id, user_id, id);
      return reply.status(204).send();
    },
  );

  app.get<{ Params: { pain_id: string } }>(
    '/pains/:pain_id/personas',
    { preHandler: requireAuth, schema: personaRouteSchemas.listPainPersonas },
    async (request, reply) => {
      const { pain_id } = request.params;
      const { workspace_id, user_id } = request.user;

      const personas = await service.listPainPersonas(workspace_id, user_id, pain_id);
      return reply.send(personas);
    },
  );

  app.post<{ Params: { pain_id: string; persona_id: string } }>(
    '/pains/:pain_id/personas/:persona_id',
    { preHandler: requireAuth, schema: personaRouteSchemas.linkPainPersona },
    async (request, reply) => {
      const { pain_id, persona_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.linkPainPersona(workspace_id, user_id, pain_id, persona_id);
      return reply.status(201).send({ pain_id, persona_id });
    },
  );

  app.delete<{ Params: { pain_id: string; persona_id: string } }>(
    '/pains/:pain_id/personas/:persona_id',
    { preHandler: requireAuth, schema: personaRouteSchemas.unlinkPainPersona },
    async (request, reply) => {
      const { pain_id, persona_id } = request.params;
      const { workspace_id, user_id } = request.user;

      await service.unlinkPainPersona(workspace_id, user_id, pain_id, persona_id);
      return reply.status(204).send();
    },
  );
}
