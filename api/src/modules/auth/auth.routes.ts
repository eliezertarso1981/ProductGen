import { FastifyInstance } from 'fastify';
import { loginSchema } from './auth.schemas';
import { loginService } from './auth.service';
import { pool } from '../../db/pool';
import { AppError } from '../../shared/errors';
import { authRouteSchemas } from '../../docs/route-docs';

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  // Body: { email: string, workspace_slug: string }
  // Retorna: { token, user, workspace }
  app.post('/auth/login', { schema: authRouteSchemas.login }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }

    const result = await loginService(pool, parsed.data);
    return reply.status(200).send(result);
  });
}
