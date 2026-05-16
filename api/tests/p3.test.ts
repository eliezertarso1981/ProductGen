import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let painA: string;
let painB: string;
let hypothesisId: string;
let roadmapItemId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  productId = fixtures.product.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);

  const p1 = await app.inject({
    method: 'POST',
    url: `/products/${productId}/pains`,
    headers: authHeader(token),
    payload: { title: 'Dor A exportação' },
  });
  painA = JSON.parse(p1.body).id;

  const p2 = await app.inject({
    method: 'POST',
    url: `/products/${productId}/pains`,
    headers: authHeader(token),
    payload: { title: 'Dor B exportação lenta' },
  });
  painB = JSON.parse(p2.body).id;

  const h = await app.inject({
    method: 'POST',
    url: `/products/${productId}/hypotheses`,
    headers: authHeader(token),
    payload: {
      title: 'Export mais rápido',
      if_clause: 'Se otimizarmos export',
      then_clause: 'Então NPS sobe',
      because_clause: 'Porque tickets caem',
    },
  });
  hypothesisId = JSON.parse(h.body).id;

  const r = await app.inject({
    method: 'POST',
    url: `/products/${productId}/roadmap`,
    headers: authHeader(token),
    payload: { type: 'feature', title: 'Otimizar export CSV' },
  });
  roadmapItemId = JSON.parse(r.body).id;
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('P3 — scoring, merge/split, PRDs, releases, handoffs', () => {
  it('PATCH scoring RICE em dor, hipótese e roadmap', async () => {
    const painScore = await app.inject({
      method: 'PATCH',
      url: `/pains/${painA}/scoring`,
      headers: authHeader(token),
      payload: {
        method: 'rice',
        payload: { reach: 1000, impact: 3, confidence: 0.8, effort: 5 },
      },
    });
    expect(painScore.statusCode).toBe(200);
    expect(JSON.parse(painScore.body).priority_score).toBeGreaterThan(0);

    const hypScore = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/scoring`,
      headers: authHeader(token),
      payload: { method: 'ice', payload: { impact: 8, confidence: 7, ease: 6 } },
    });
    expect(hypScore.statusCode).toBe(200);

    const roadmapScore = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${roadmapItemId}/scoring`,
      headers: authHeader(token),
      payload: {
        method: 'rice',
        payload: { reach: 500, impact: 2, confidence: 0.9, effort: 3 },
      },
    });
    expect(roadmapScore.statusCode).toBe(200);
  });

  it('merge e split de pains com pain_relationships', async () => {
    const merge = await app.inject({
      method: 'POST',
      url: `/pains/${painA}/merge`,
      headers: authHeader(token),
      payload: { source_pain_ids: [painB], reason: 'Mesma raiz de problema' },
    });
    expect(merge.statusCode).toBe(200);

    const rels = await app.inject({
      method: 'GET',
      url: `/pains/${painA}/relationships`,
      headers: authHeader(token),
    });
    expect(rels.statusCode).toBe(200);
    expect(JSON.parse(rels.body).length).toBeGreaterThanOrEqual(1);

    const p3 = await app.inject({
      method: 'POST',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
      payload: { title: 'Dor onboarding complexo' },
    });
    const parentId = JSON.parse(p3.body).id;

    const split = await app.inject({
      method: 'POST',
      url: `/pains/${parentId}/split`,
      headers: authHeader(token),
      payload: {
        children: [
          { title: 'Cadastro longo' },
          { title: 'Validação confusa' },
        ],
      },
    });
    expect(split.statusCode).toBe(201);
    expect(JSON.parse(split.body).length).toBe(2);
  });

  it('PRD versionado, release e engineering handoff', async () => {
    const prd = await app.inject({
      method: 'POST',
      url: `/roadmap/${roadmapItemId}/prds`,
      headers: authHeader(token),
      payload: {
        title: 'PRD Export v1',
        content: '## Escopo\nOtimizar pipeline de exportação CSV.',
      },
    });
    expect(prd.statusCode).toBe(201);
    const prdId = JSON.parse(prd.body).id;

    const approve = await app.inject({
      method: 'PATCH',
      url: `/prds/${prdId}/status`,
      headers: authHeader(token),
      payload: { status: 'approved' },
    });
    expect(approve.statusCode).toBe(200);

    const release = await app.inject({
      method: 'POST',
      url: `/products/${productId}/releases`,
      headers: authHeader(token),
      payload: { version: 'v2.4.0', title: 'Release export' },
    });
    expect(release.statusCode).toBe(201);

    const handoff = await app.inject({
      method: 'POST',
      url: `/roadmap/${roadmapItemId}/engineering-handoffs`,
      headers: authHeader(token),
      payload: {
        external_provider: 'jira',
        external_project: 'PG',
        external_ticket_id: 'PG-101',
        approved_for_delivery: true,
      },
    });
    expect(handoff.statusCode).toBe(201);
  });
});
