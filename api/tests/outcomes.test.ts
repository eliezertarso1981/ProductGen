import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let roadmapItemId: string;
let outcomeId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  productId = fixtures.product.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);

  const roadmap = await app.inject({
    method: 'POST',
    url: `/products/${productId}/roadmap`,
    headers: authHeader(token),
    payload: {
      type: 'feature',
      title: 'Feature para medir outcome',
    },
  });
  roadmapItemId = JSON.parse(roadmap.body).id;
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('P2 Strategy — outcomes', () => {
  it('POST /roadmap/:id/outcomes cria outcome', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/roadmap/${roadmapItemId}/outcomes`,
      headers: authHeader(token),
      payload: {
        hypothesized_impact: 'Reduzir tempo de exportação em 30%',
        measurement_window_days: 60,
        baseline_value: 120,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    outcomeId = body.id;
    expect(body.status).toBe('hypothesized');
    expect(body.measurement_window_days).toBe(60);
  });

  it('GET lista outcomes do roadmap item', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/roadmap/${roadmapItemId}/outcomes`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).length).toBe(1);
  });

  it('PATCH /outcomes/:id/status transiciona lifecycle', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/outcomes/${outcomeId}/status`,
      headers: authHeader(token),
      payload: { status: 'measuring' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('measuring');
  });

  it('PATCH atualiza valores e DELETE faz soft delete', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: `/outcomes/${outcomeId}`,
      headers: authHeader(token),
      payload: { final_value: 85, conclusion: 'Melhoria observada na média' },
    });
    expect(patch.statusCode).toBe(200);

    const del = await app.inject({
      method: 'DELETE',
      url: `/outcomes/${outcomeId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/outcomes/${outcomeId}`,
      headers: authHeader(token),
    });
    expect(get.statusCode).toBe(404);
  });
});
