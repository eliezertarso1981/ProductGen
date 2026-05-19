import { Pool } from 'pg';
import { AppError } from '../../shared/errors';
import { verifyPassword } from '../../auth/password';

const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos');

export interface AuthenticatedIdentity {
  user: {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
  };
}

export interface IdentityProvider {
  authenticate(input: {
    email: string;
    password: string;
  }): Promise<AuthenticatedIdentity>;
}

export class LocalIdentityProvider implements IdentityProvider {
  constructor(private readonly pool: Pool) {}

  async authenticate(input: {
    email: string;
    password: string;
  }): Promise<AuthenticatedIdentity> {
    const userResult = await this.pool.query<{
      id: string;
      name: string;
      email: string;
      email_verified_at: string | null;
      password_hash: string | null;
    }>(
      `SELECT id, name, email, email_verified_at, password_hash
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [input.email],
    );

    const user = userResult.rows[0];
    if (!user?.password_hash) throw invalidCredentials();

    const passwordMatches = await verifyPassword(input.password, user.password_hash);
    if (!passwordMatches) throw invalidCredentials();

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified_at: user.email_verified_at,
      },
    };
  }
}
