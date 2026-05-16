import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let hypothesisId: string;
let experimentId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  token = await loginAs(app, fixtures.email, fixtures.slug);

  const hyp = await app.inject({
    method: 'POST',
    url: `/products/${fixtures.product.id}/hypotheses`,
    headers: authHeader(token),
    payload: {
      title: 'Onboarding guiado reduz abandono',
      if_clause: 'Se adicionarmos onboarding guiado',
      then_clause: 'Então a taxa de ativação sobe',
      because_clause: 'Porque usuários não entendem o primeiro passo',
    },
  });
  hypothesisId = JSON.parse(hyp.body).id;
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('CRUD de experiments', () => {
  it('POST /hypotheses/:id/experiments cria experimento em planned', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/hypotheses/${hypothesisId}/experiments`,
      headers: authHeader(token),
      payload: {
        title: 'Teste A/B do onboarding',
        method: 'ab_test',
        success_criteria: 'Taxa de ativação >= 40% na variante B',
        sample_target: 200,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('planned');
    experimentId = body.id;
  });

  it('GET /hypotheses/:id/experiments lista experimentos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/hypotheses/${hypothesisId}/experiments`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).length).toBeGreaterThanOrEqual(1);
  });

  it('fluxo planned → running → completed → analyzed permite validar hipótese', async () => {
    const running = await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'running' },
    });
    expect(running.statusCode).toBe(200);

    const completed = await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'completed' },
    });
    expect(completed.statusCode).toBe(200);

    const analyzed = await app.inject({
      method: 'PATCH',
      url: `/experiments/${experimentId}/status`,
      headers: authHeader(token),
      payload: { status: 'analyzed', result: 'validated', learnings: 'Variante B superou controle' },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(JSON.parse(analyzed.body).result).toBe('validated');

    const validating = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'validating' },
    });
    expect(validating.statusCode).toBe(200);

    const validated = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'validated' },
    });
    expect(validated.statusCode).toBe(200);
    expect(JSON.parse(validated.body).status).toBe('validated');
  });

  it('PATCH analyzed sem result retorna 400', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/hypotheses/${hypothesisId}/experiments`,
      headers: authHeader(token),
      payload: {
        title: 'Entrevista rápida',
        method: 'interview',
        success_criteria: '3 de 5 usuários confirmam a dor',
      },
    });
    const id = JSON.parse(create.body).id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/experiments/${id}/status`,
      headers: authHeader(token),
      payload: { status: 'analyzed' },
    });
    expect(res.statusCode).toBe(400);
  });
});
