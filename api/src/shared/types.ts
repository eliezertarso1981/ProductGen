import { JwtPayload } from '../auth/jwt';

// Adiciona a propriedade `user` ao tipo padrão do Fastify Request.
// Ela é preenchida pelo middleware `requireAuth` antes de qualquer handler protegido.
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

export {};
