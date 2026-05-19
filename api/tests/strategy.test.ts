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

describe('Strategy / OKRs', () => {
  it('cria pilar estratégico com código humano', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/strategic-pillars`,
      headers: authHeader(token),
      payload: {
        name: 'Eficiência operacional',
        description: 'Reduzir trabalho manual do PM',
        color: '#2563EB',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.code).toMatch(/^PL-\d{2,}$/);
    expect(body.name).toBe('Eficiência operacional');
    pillarId = body.id;
  });

  it('cria objetivo vinculado ao pilar com código OKR', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/objectives`,
      headers: authHeader(token),
      payload: {
        title: 'Aumentar velocidade de aprendizado',
        description: 'Diminuir o tempo entre hipótese e evidência',
        horizon_start: '2026-04-01',
        horizon_end: '2026-06-30',
        pillar_id: pillarId,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.code).toMatch(/^OKR-\d{2,}$/);
    expect(body.pillar_id).toBe(pillarId);
    expect(body.status).toBe('draft');
    objectiveId = body.id;
  });

  it('lista objetivos com o vínculo do pilar', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/objectives`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const objective = body.find((item: { id: string }) => item.id === objectiveId);
    expect(objective.code).toMatch(/^OKR-\d{2,}$/);
    expect(objective.pillar_id).toBe(pillarId);
  });

  it('cria key result com código humano por objetivo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/objectives/${objectiveId}/key-results`,
      headers: authHeader(token),
      payload: {
        title: 'Reduzir ciclo de validação',
        metric_type: 'dias',
        baseline: 14,
        target: 5,
        current_value: 10,
        unit: 'd',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.code).toMatch(/^KR-\d{2,}$/);
    keyResultId = body.id;
  });

  it('cria, lista e remove vínculos de dor com pilar e OKR', async () => {
    const pain = await app.inject({
      method: 'POST',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
      payload: {
        title: 'Dor conectada à estratégia',
        description: 'Usada para validar vínculos cross-domain',
        severity: 4,
      },
    });
    expect(pain.statusCode).toBe(201);
    painId = JSON.parse(pain.body).id;

    const linkPillar = await app.inject({
      method: 'POST',
      url: `/pains/${painId}/strategic-pillars/${pillarId}`,
      headers: authHeader(token),
    });
    expect(linkPillar.statusCode).toBe(201);
    expect(JSON.parse(linkPillar.body)).toEqual({ pain_id: painId, pillar_id: pillarId });

    const linkObjective = await app.inject({
      method: 'POST',
      url: `/pains/${painId}/objectives/${objectiveId}`,
      headers: authHeader(token),
    });
    expect(linkObjective.statusCode).toBe(201);
    expect(JSON.parse(linkObjective.body)).toEqual({ pain_id: painId, objective_id: objectiveId });

    const pillars = await app.inject({
      method: 'GET',
      url: `/pains/${painId}/strategic-pillars`,
      headers: authHeader(token),
    });
    expect(pillars.statusCode).toBe(200);
    expect(JSON.parse(pillars.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: pillarId, code: expect.stringMatching(/^PL-\d{2,}$/) }),
      ]),
    );

    const objectives = await app.inject({
      method: 'GET',
      url: `/pains/${painId}/objectives`,
      headers: authHeader(token),
    });
    expect(objectives.statusCode).toBe(200);
    expect(JSON.parse(objectives.body)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: objectiveId, code: expect.stringMatching(/^OKR-\d{2,}$/) }),
      ]),
    );

    const unlinkObjective = await app.inject({
      method: 'DELETE',
      url: `/pains/${painId}/objectives/${objectiveId}`,
      headers: authHeader(token),
    });
    expect(unlinkObjective.statusCode).toBe(204);

    const unlinkPillar = await app.inject({
      method: 'DELETE',
      url: `/pains/${painId}/strategic-pillars/${pillarId}`,
      headers: authHeader(token),
    });
    expect(unlinkPillar.statusCode).toBe(204);

    const emptyPillars = await app.inject({
      method: 'GET',
      url: `/pains/${painId}/strategic-pillars`,
      headers: authHeader(token),
    });
    expect(JSON.parse(emptyPillars.body)).toHaveLength(0);
  });

  it('atualiza key result e status do objetivo', async () => {
    const kr = await app.inject({
      method: 'PATCH',
      url: `/key-results/${keyResultId}`,
      headers: authHeader(token),
      payload: { current_value: 7 },
    });
    expect(kr.statusCode).toBe(200);
    expect(JSON.parse(kr.body).current_value).toBe(7);

    const objective = await app.inject({
      method: 'PATCH',
      url: `/objectives/${objectiveId}/status`,
      headers: authHeader(token),
      payload: { status: 'active' },
    });
    expect(objective.statusCode).toBe(200);
    expect(JSON.parse(objective.body).status).toBe('active');
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
