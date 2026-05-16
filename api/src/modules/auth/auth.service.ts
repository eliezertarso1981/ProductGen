import { Pool } from 'pg';
import { LoginInput } from './auth.schemas';
import { AppError } from '../../shared/errors';
import { signToken } from '../../auth/jwt';

// MOCK DE DEV: sem verificação de senha.
// users e workspaces não têm RLS, então podemos consultar diretamente no pool.
export async function loginService(pool: Pool, input: LoginInput) {
  const userResult = await pool.query<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [input.email],
  );

  if (userResult.rows.length === 0) {
    // Mesma mensagem de erro para usuário não encontrado e workspace inválido
    // evita revelar se o email existe (user enumeration attack)
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou workspace inválido');
  }

  const user = userResult.rows[0];

  const wsResult = await pool.query<{ id: string; role: string }>(
    `SELECT w.id, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE w.slug = $1
       AND w.deleted_at IS NULL
       AND wm.user_id = $2
       AND wm.removed_at IS NULL`,
    [input.workspace_slug, user.id],
  );

  if (wsResult.rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou workspace inválido');
  }

  const workspace = wsResult.rows[0];

  const token = await signToken({
    user_id: user.id,
    workspace_id: workspace.id,
    role: workspace.role,
  });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
    workspace: { id: workspace.id, role: workspace.role },
  };
}
