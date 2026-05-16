import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let email: string;
let slug: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  email = fixtures.email;
  slug = fixtures.slug;
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('POST /auth/login', () => {
  it('retorna 200 e token com credenciais válidas', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, workspace_slug: slug },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.workspace.role).toBe('owner');
  });

  it('retorna 401 para email desconhecido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'naoexiste@example.com', workspace_slug: slug },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('retorna 401 para workspace errado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, workspace_slug: 'workspace-que-nao-existe' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('retorna 400 para body inválido (sem email)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { workspace_slug: slug },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('Rota protegida sem token', () => {
  it('retorna 401 ao acessar /pains sem Authorization', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/pains/00000000-0000-0000-0000-000000000000',
    });

    expect(res.statusCode).toBe(401);
  });
});
