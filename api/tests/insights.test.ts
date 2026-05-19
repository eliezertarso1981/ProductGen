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
  it('POST /products/:id/insights cria insight sem evidência obrigatória e gera code', async () => {
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
    expect(body.product_id).toBe(productId);
    expect(body.code).toBe('IN-01');
    expect(body.evidence_count).toBe(0);
  });

  it('lista insights do produto com identificador humano persistido', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/insights`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: insightId,
          code: 'IN-01',
          evidence_count: 0,
        }),
      ]),
    );
  });

  it('mantém IN-XX sequencial por produto', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/insights`,
      headers: authHeader(token),
      payload: {
        title: 'Segundo insight',
        description: 'Mais um insight de produto sem vínculo inicial.',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).code).toBe('IN-02');
  });

  it('vincula evidência opcional, lista e remove vínculo', async () => {
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
    const linkedEvidences = JSON.parse(list.body);
    expect(linkedEvidences).toHaveLength(1);
    expect(linkedEvidences[0]).toEqual(
      expect.objectContaining({
        id: evidenceId,
        code: 'EV-01',
        title: 'Ticket #99 export CSV',
      }),
    );

    const unlink = await app.inject({
      method: 'DELETE',
      url: `/insights/${insightId}/evidences/${evidenceId}`,
      headers: authHeader(token),
    });
    expect(unlink.statusCode).toBe(204);

    const afterUnlink = await app.inject({
      method: 'GET',
      url: `/insights/${insightId}`,
      headers: authHeader(token),
    });
    expect(JSON.parse(afterUnlink.body).evidence_count).toBe(0);

    const emptyList = await app.inject({
      method: 'GET',
      url: `/insights/${insightId}/evidences`,
      headers: authHeader(token),
    });
    expect(JSON.parse(emptyList.body)).toHaveLength(0);
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
