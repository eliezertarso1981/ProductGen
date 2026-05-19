import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let initiativeId: string;

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

describe('CRUD de roadmap_items', () => {
  it('POST /products/:id/roadmap cria uma initiative (root) com path preenchido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
      payload: {
        type: 'initiative',
        title: 'Reduzir fricção no onboarding',
        planned_start: '2025-07-01',
        planned_end: '2025-12-31',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.type).toBe('initiative');
    expect(body.code).toMatch(/^RM-\d{2,}$/);
    expect(body.status).toBe('proposed');
    // path é o id sem hifens (ltree converte - para _)
    expect(body.path).toBeTruthy();
    expect(body.path).not.toContain('-');
    initiativeId = body.id;
  });

  it('POST /products/:id/roadmap cria um epic filho com path composto', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
      payload: {
        parent_id: initiativeId,
        type: 'epic',
        title: 'Simplificar cadastro de conta',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.parent_id).toBe(initiativeId);
    expect(body.code).toMatch(/^RM-\d{2,}$/);
    // path do filho começa com o path do pai
    const parentPath = initiativeId.replace(/-/g, '_');
    expect(body.path).toContain(parentPath);
    expect(body.path.split('.').length).toBe(2); // pai.filho
  });

  it('GET /products/:id/roadmap lista itens em ordem hierárquica (pai antes do filho)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const items = JSON.parse(res.body) as Array<{ id: string; path: string; code: string }>;
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].code).toMatch(/^RM-\d{2,}$/);

    // O pai deve vir antes do filho (ordenação por path ltree)
    const parentIndex = items.findIndex((i) => i.id === initiativeId);
    const childIndex = items.findIndex((i) => i.parent_id === initiativeId);
    expect(parentIndex).toBeLessThan(childIndex);
  });

  it('PATCH /roadmap/:id atualiza campos do item', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${initiativeId}`,
      headers: authHeader(token),
      payload: { effort_estimate: 'L', priority_score: 85 },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.effort_estimate).toBe('L');
    expect(body.priority_score).toBe(85);
  });

  it('PATCH /roadmap/:id/status retorna 422 ao cancelar sem cancel_reason', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${initiativeId}/status`,
      headers: authHeader(token),
      payload: { status: 'cancelled' },
    });

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('REASON_REQUIRED');
  });
});
