import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let insightId: string;
let evidenceId: string;

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

describe('CRUD de insights', () => {
  it('POST /products/:id/insights cria insight', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/insights`,
      headers: authHeader(token),
      payload: {
        title: 'Exportação é ponto de atrito',
        description: 'Vários tickets citam falha ao exportar CSV.',
        confidence_score: 0.7,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    insightId = body.id;
    expect(body.evidence_count).toBe(0);
  });

  it('vincula evidência e incrementa evidence_count', async () => {
    const ev = await app.inject({
      method: 'POST',
      url: `/products/${productId}/evidences`,
      headers: authHeader(token),
      payload: {
        title: 'Ticket #99 export CSV',
        content: 'Erro 500 ao exportar',
        source: 'support_ticket',
        collected_at: new Date().toISOString(),
      },
    });
    evidenceId = JSON.parse(ev.body).id;

    const link = await app.inject({
      method: 'POST',
      url: `/insights/${insightId}/evidences/${evidenceId}`,
      headers: authHeader(token),
    });
    expect(link.statusCode).toBe(201);

    const get = await app.inject({
      method: 'GET',
      url: `/insights/${insightId}`,
      headers: authHeader(token),
    });
    expect(JSON.parse(get.body).evidence_count).toBe(1);

    const list = await app.inject({
      method: 'GET',
      url: `/insights/${insightId}/evidences`,
      headers: authHeader(token),
    });
    expect(JSON.parse(list.body).length).toBe(1);
  });

  it('DELETE insight faz soft delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/insights/${insightId}`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(204);
  });
});
