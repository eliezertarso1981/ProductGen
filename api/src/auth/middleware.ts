import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt';

// Use como preHandler nas rotas que precisam de autenticação:
//   app.get('/rota', { preHandler: requireAuth }, handler)
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Token não informado' },
    });
  }

  try {
    const token = header.slice(7);
    request.user = await verifyToken(token);
  } catch {
    return reply.status(401).send({
      error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' },
    });
  }
}
