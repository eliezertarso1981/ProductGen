import { Pool, PoolClient } from 'pg';

/**
 * Toda operação no banco DEVE passar por aqui.
 * Seta o workspace no RLS antes de qualquer query — sem isso, o Postgres bloqueia tudo.
 */
export async function withWorkspaceTx<T>(
  pool: Pool,
  workspaceId: string,
  actorId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // PRD: RLS usa current_setting('app.current_workspace', true)::uuid
    // Postgres trata GUC como TEXT; set_config recebe valor como texto.
    // Usamos set_config para evitar qualquer problema de sintaxe com SET LOCAL para chaves com ponto.
    await client.query(
      'SELECT set_config(\'app.current_workspace\', $1, true)',
      [workspaceId],
    );
    await client.query(
      'SELECT set_config(\'app.current_actor\', $1, true)',
      [actorId],
    );

    if (process.env.NODE_ENV === 'test') {
      const settings = await client.query<{
        workspace: string | null;
        actor: string | null;
      }>(
        `
          SELECT
            current_setting('app.current_workspace', true)::text AS workspace,
            current_setting('app.current_actor', true)::text AS actor
        `,
      );

      console.log('[RLS tenant debug]', {
        passed_workspaceId: workspaceId,
        passed_actorId: actorId,
        current_workspace: settings.rows[0]?.workspace ?? null,
        current_actor: settings.rows[0]?.actor ?? null,
      });
    }

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
