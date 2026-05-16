import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let painId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  productId = fixtures.product.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('CRUD de pains', () => {
  it('POST /products/:id/pains cria uma dor e retorna 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
      payload: {
        title: 'Usuários não conseguem exportar relatórios',
        description: 'Reclamação recorrente no suporte',
        severity: 4,
        reach_estimate: 200,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.status).toBe('identified');
    expect(body.severity).toBe(4);
    painId = body.id; // guarda para os próximos testes
  });

  it('GET /products/:id/pains lista as dores do produto', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].product_id).toBe(productId);
  });

  it('GET /pains/:id retorna a dor criada', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/pains/${painId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).id).toBe(painId);
  });

  it('PATCH /pains/:id atualiza campos da dor', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/pains/${painId}`,
      headers: authHeader(token),
      payload: { severity: 5, reach_estimate: 500 },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.severity).toBe(5);
    expect(body.reach_estimate).toBe(500);
  });

  it('PATCH /pains/:id/status faz a transição identified → investigating', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/pains/${painId}/status`,
      headers: authHeader(token),
      payload: { status: 'investigating' },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('investigating');
  });

  it('PATCH /pains/:id/status retorna 422 para transição inválida (investigating → addressed)', async () => {
    // Addressed só pode vir de "prioritized", não de "investigating"
    const res = await app.inject({
      method: 'PATCH',
      url: `/pains/${painId}/status`,
      headers: authHeader(token),
      payload: { status: 'addressed' },
    });

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_LIFECYCLE_TRANSITION');
  });

  it('PATCH /pains/:id/status retorna 422 ao descartar sem discard_reason', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/pains/${painId}/status`,
      headers: authHeader(token),
      payload: { status: 'discarded' },
    });

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('REASON_REQUIRED');
  });

  it('DELETE /pains/:id faz soft delete e GET seguinte retorna 404', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/pains/${painId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/pains/${painId}`,
      headers: authHeader(token),
    });
    expect(get.statusCode).toBe(404);
  });
});
