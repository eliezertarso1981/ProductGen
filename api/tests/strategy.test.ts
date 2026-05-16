import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let pillarId: string;
let objectiveId: string;
let keyResultId: string;

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

describe('P2 Strategy — pilares, objetivos e key results', () => {
  it('CRUD de strategic_pillars', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productId}/strategic-pillars`,
      headers: authHeader(token),
      payload: {
        name: 'Retenção',
        description: 'Foco em usuários ativos',
        color: '#3366FF',
        position: 1,
      },
    });
    expect(create.statusCode).toBe(201);
    const pillar = JSON.parse(create.body);
    pillarId = pillar.id;
    expect(pillar.name).toBe('Retenção');

    const list = await app.inject({
      method: 'GET',
      url: `/products/${productId}/strategic-pillars`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBeGreaterThanOrEqual(1);

    const patch = await app.inject({
      method: 'PATCH',
      url: `/strategic-pillars/${pillarId}`,
      headers: authHeader(token),
      payload: { name: 'Retenção e engajamento' },
    });
    expect(patch.statusCode).toBe(200);
    expect(JSON.parse(patch.body).name).toBe('Retenção e engajamento');
  });

  it('CRUD de objectives com transição de status', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productId}/objectives`,
      headers: authHeader(token),
      payload: {
        title: 'Aumentar retenção no Q3',
        description: 'OKR trimestral',
        horizon_start: '2025-07-01',
        horizon_end: '2025-09-30',
      },
    });
    expect(create.statusCode).toBe(201);
    const objective = JSON.parse(create.body);
    objectiveId = objective.id;
    expect(objective.status).toBe('draft');

    const activate = await app.inject({
      method: 'PATCH',
      url: `/objectives/${objectiveId}/status`,
      headers: authHeader(token),
      payload: { status: 'active' },
    });
    expect(activate.statusCode).toBe(200);
    expect(JSON.parse(activate.body).status).toBe('active');
  });

  it('CRUD de key_results aninhados em objective', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/objectives/${objectiveId}/key-results`,
      headers: authHeader(token),
      payload: {
        title: 'WAU +15%',
        metric_type: 'growth',
        baseline: 1000,
        target: 1150,
        unit: 'users',
      },
    });
    expect(create.statusCode).toBe(201);
    const kr = JSON.parse(create.body);
    keyResultId = kr.id;
    expect(kr.objective_id).toBe(objectiveId);

    const list = await app.inject({
      method: 'GET',
      url: `/objectives/${objectiveId}/key-results`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBe(1);

    const patch = await app.inject({
      method: 'PATCH',
      url: `/key-results/${keyResultId}`,
      headers: authHeader(token),
      payload: { current_value: 1050 },
    });
    expect(patch.statusCode).toBe(200);
    expect(JSON.parse(patch.body).current_value).toBe(1050);
  });

  it('soft delete de pillar, objective e key result', async () => {
    const delKr = await app.inject({
      method: 'DELETE',
      url: `/key-results/${keyResultId}`,
      headers: authHeader(token),
    });
    expect(delKr.statusCode).toBe(204);

    const delObj = await app.inject({
      method: 'DELETE',
      url: `/objectives/${objectiveId}`,
      headers: authHeader(token),
    });
    expect(delObj.statusCode).toBe(204);

    const delPillar = await app.inject({
      method: 'DELETE',
      url: `/strategic-pillars/${pillarId}`,
      headers: authHeader(token),
    });
    expect(delPillar.statusCode).toBe(204);
  });
});
