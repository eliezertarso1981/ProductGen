import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;

let tokenA: string;
let tokenB: string;
let productAId: string;
let productBId: string;
let painAId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });

  const fixturesA = await createFixtures(adminPool);
  const fixturesB = await createFixtures(adminPool);

  productAId = fixturesA.product.id;
  productBId = fixturesB.product.id;
  tokenA = await loginAs(app, fixturesA.email, fixturesA.slug);
  tokenB = await loginAs(app, fixturesB.email, fixturesB.slug);
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('isolamento entre workspaces', () => {
  it('um workspace nao enxerga pains criadas em outro workspace', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productAId}/pains`,
      headers: authHeader(tokenA),
      payload: {
        title: 'Exportacao quebra em contas enterprise',
        description: 'Dor criada no workspace A',
        severity: 4,
      },
    });

    expect(create.statusCode).toBe(201);
    painAId = JSON.parse(create.body).id;

    const listFromB = await app.inject({
      method: 'GET',
      url: `/products/${productAId}/pains`,
      headers: authHeader(tokenB),
    });

    expect(listFromB.statusCode).toBe(200);
    expect(JSON.parse(listFromB.body)).toEqual([]);
  });

  it('um workspace nao busca uma pain de outro workspace por id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/pains/${painAId}`,
      headers: authHeader(tokenB),
    });

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe('NOT_FOUND');
  });
});

describe('validacoes de entrada', () => {
  it('rejeita criacao de pain com titulo curto', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productBId}/pains`,
      headers: authHeader(tokenB),
      payload: { title: 'ab' },
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('rejeita PATCH vazio em pain', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productBId}/pains`,
      headers: authHeader(tokenB),
      payload: { title: 'Checkout sem feedback visual' },
    });
    const id = JSON.parse(create.body).id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/pains/${id}`,
      headers: authHeader(tokenB),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('VALIDATION_ERROR');
  });
});
