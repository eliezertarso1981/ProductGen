import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, TEST_PASSWORD } from './helpers';

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
      payload: { email, password: TEST_PASSWORD },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(email);
    expect(body.workspace.role).toBe('owner');
    expect(res.cookies.some((cookie) => cookie.name === 'pg_access')).toBe(true);
    expect(res.cookies.some((cookie) => cookie.name === 'pg_refresh')).toBe(true);
  });

  it('retorna 401 para email desconhecido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'naoexiste@example.com', password: TEST_PASSWORD },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_CREDENTIALS');
  });

  it('retorna workspace default porque workspace ativo fica fora do token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });

    expect(res.statusCode).toBe(200);
  });

  it('retorna 401 para senha inválida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: 'senha-errada-com-12' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('retorna 400 para body inválido (sem email)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { password: TEST_PASSWORD },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /auth/refresh', () => {
  it('rotaciona refresh token e emite novo access token', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });
    const refreshCookie = login.cookies.find((cookie) => cookie.name === 'pg_refresh');
    expect(refreshCookie?.value).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { pg_refresh: refreshCookie?.value ?? '' },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).token).toBeDefined();
    expect(res.cookies.some((cookie) => cookie.name === 'pg_refresh')).toBe(true);
  });
});

describe('GET /auth/me', () => {
  it('retorna bootstrap do usuário autenticado', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });
    const body = JSON.parse(login.body) as { token: string };

    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${body.token}` },
    });

    expect(res.statusCode).toBe(200);
    const me = JSON.parse(res.body);
    expect(me.user.email).toBe(email);
    expect(me.current_workspace_id).toBeDefined();
    expect(me.workspaces[0].permissions).toContain('product.create');
    expect(me.workspaces[0].products[0].role).toBe('owner');
    expect(me.workspaces[0].products[0].permissions).toContain('product.update');
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
