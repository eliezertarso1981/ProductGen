import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
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

describe('CRUD de evidences', () => {
  it('POST /products/:id/evidences cria uma evidence e retorna 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/evidences`,
      headers: authHeader(token),
      payload: {
        title: 'Print de conversa do suporte sobre exportações',
        content: 'Usuários relatam falhas ao exportar relatórios em CSV.',
        source: 'support_ticket',
        source_url: 'https://example.com/ticket/123',
        customer_identifier: 'cust-abc',
        collected_at: new Date().toISOString(),
        metadata: { priority: 'high' },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.status).toBe('new');
    expect(body.product_id).toBe(productId);
    evidenceId = body.id;
  });

  it('GET /products/:id/evidences lista as evidences do produto', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/evidences`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].product_id).toBe(productId);
  });

  it('GET /evidences/:id retorna a evidence criada', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/evidences/${evidenceId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(evidenceId);
    expect(body.status).toBe('new');
  });

  it('PATCH /evidences/:id atualiza campos da evidence', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/evidences/${evidenceId}`,
      headers: authHeader(token),
      payload: {
        title: 'Ticket com impacto maior',
        content: 'Confirmado que falha ocorre também no Excel (XLSX).',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.title).toBe('Ticket com impacto maior');
    expect(body.content).toBe('Confirmado que falha ocorre também no Excel (XLSX).');
  });

  it('PATCH /evidences/:id/status faz a transição new → triaged', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/evidences/${evidenceId}/status`,
      headers: authHeader(token),
      payload: { status: 'triaged' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('triaged');
  });

  it('PATCH /evidences/:id/status pode transicionar triaged → archived', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/evidences/${evidenceId}/status`,
      headers: authHeader(token),
      payload: { status: 'archived' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('archived');
  });

  it('DELETE /evidences/:id faz soft delete e GET seguinte retorna 404', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/evidences/${evidenceId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/evidences/${evidenceId}`,
      headers: authHeader(token),
    });
    expect(get.statusCode).toBe(404);
  });
});
