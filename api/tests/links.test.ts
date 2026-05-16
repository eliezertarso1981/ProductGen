import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let painId: string;
let hypothesisId: string;
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

describe('vínculos discovery ↔ delivery', () => {
  it('vincula dor ↔ hipótese e hipótese ↔ roadmap', async () => {
    const pain = await app.inject({
      method: 'POST',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
      payload: { title: 'Exportação lenta', description: 'Usuários abandonam export' },
    });
    painId = JSON.parse(pain.body).id;

    const hyp = await app.inject({
      method: 'POST',
      url: `/products/${productId}/hypotheses`,
      headers: authHeader(token),
      payload: {
        title: 'Cache de export acelera fluxo',
        if_clause: 'Se cachearmos agregações',
        then_clause: 'Então exportação cai para <5s',
        because_clause: 'Porque o gargalo é recomputar agregados',
      },
    });
    hypothesisId = JSON.parse(hyp.body).id;

    const linkPain = await app.inject({
      method: 'POST',
      url: `/pains/${painId}/hypotheses/${hypothesisId}`,
      headers: authHeader(token),
    });
    expect(linkPain.statusCode).toBe(201);

    const listHyp = await app.inject({
      method: 'GET',
      url: `/pains/${painId}/hypotheses`,
      headers: authHeader(token),
    });
    expect(JSON.parse(listHyp.body).length).toBe(1);

    const initiative = await app.inject({
      method: 'POST',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
      payload: { type: 'initiative', title: 'Performance de exportação' },
    });
    initiativeId = JSON.parse(initiative.body).id;

    const linkRoadmap = await app.inject({
      method: 'POST',
      url: `/hypotheses/${hypothesisId}/roadmap/${initiativeId}`,
      headers: authHeader(token),
    });
    expect(linkRoadmap.statusCode).toBe(201);

    const listRoadmap = await app.inject({
      method: 'GET',
      url: `/hypotheses/${hypothesisId}/roadmap`,
      headers: authHeader(token),
    });
    expect(JSON.parse(listRoadmap.body).length).toBe(1);
  });

  it('initiative pode ir para planned com hipótese validada vinculada', async () => {
    const exp = await app.inject({
      method: 'POST',
      url: `/hypotheses/${hypothesisId}/experiments`,
      headers: authHeader(token),
      payload: {
        title: 'Benchmark export',
        method: 'prototype',
        success_criteria: 'Tempo médio abaixo de 5 segundos',
      },
    });
    const experimentId = JSON.parse(exp.body).id;

    await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'running' },
    });
    await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'completed' },
    });
    await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'analyzed', result: 'validated' },
    });

    await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'validating' },
    });
    await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'validated' },
    });

    const planned = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${initiativeId}/status`,
      headers: authHeader(token),
      payload: { status: 'planned' },
    });
    expect(planned.statusCode).toBe(200);
    expect(JSON.parse(planned.body).status).toBe('planned');
  });
});
