import { JwtPayload } from '../auth/jwt';
import { Permission } from '../auth/permissions';
import '@fastify/cookie';

export interface AuthenticatedUser extends JwtPayload {
  workspace_id: string;
  role: string;
}

// Adiciona a propriedade `user` ao tipo padrão do Fastify Request.
// Ela é preenchida pelo middleware `requireAuth` antes de qualquer handler protegido.
declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
    permissions?: Set<Permission>;
  }
}

export {};
