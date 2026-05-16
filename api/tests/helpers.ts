import { Pool } from 'pg';
import type { buildApp } from '../src/app';

type App = ReturnType<typeof buildApp>;

// Cria workspace + user + produto com dados únicos por chamada (sem conflito entre testes)
export async function createFixtures(adminPool: Pool) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const slug = `test-ws-${suffix}`;
  const email = `test-${suffix}@example.com`;

  // adminPool conecta como postgres (superuser) — bypassa o RLS automaticamente
  const ws = await adminPool.query(
    `INSERT INTO workspaces (name, slug) VALUES ('Test Workspace', $1) RETURNING *`,
    [slug],
  );
  const workspace = ws.rows[0] as { id: string; slug: string };

  const usr = await adminPool.query(
    `INSERT INTO users (email, name) VALUES ($1, 'Test User') RETURNING *`,
    [email],
  );
  const user = usr.rows[0] as { id: string; email: string };

  await adminPool.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [workspace.id, user.id],
  );

  const prod = await adminPool.query(
    `INSERT INTO products (workspace_id, name) VALUES ($1, 'Test Product') RETURNING *`,
    [workspace.id],
  );
  const product = prod.rows[0] as { id: string };

  return { workspace, user, product, slug, email };
}

// Faz login e retorna o Bearer token
export async function loginAs(app: App, email: string, slug: string): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, workspace_slug: slug },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login falhou (${res.statusCode}): ${res.body}`);
  }
  return (JSON.parse(res.body) as { token: string }).token;
}

// Monta o header de autorização para injeção de requests
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
