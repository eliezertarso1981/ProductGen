import { Pool } from 'pg';
import type { buildApp } from '../src/app';
import { hashPassword } from '../src/auth/password';

type App = ReturnType<typeof buildApp>;
export const TEST_PASSWORD = 'productgen123';

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
    `INSERT INTO users (email, name, password_hash) VALUES ($1, 'Test User', $2) RETURNING *`,
    [email, await hashPassword(TEST_PASSWORD)],
  );
  const user = usr.rows[0] as { id: string; email: string };

  await adminPool.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [workspace.id, user.id],
  );

  const prod = await adminPool.query(
    `INSERT INTO products (workspace_id, slug, name) VALUES ($1, $2, 'Test Product') RETURNING *`,
    [workspace.id, `test-product-${suffix}`],
  );
  const product = prod.rows[0] as { id: string };

  await adminPool.query(
    `INSERT INTO product_members (product_id, workspace_id, user_id, role)
     VALUES ($1, $2, $3, 'owner')`,
    [product.id, workspace.id, user.id],
  );

  return { workspace, user, product, slug, email };
}

// Faz login e retorna o Bearer token
export async function loginAs(app: App, email: string, slug: string): Promise<string> {
  void slug;
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password: TEST_PASSWORD },
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
