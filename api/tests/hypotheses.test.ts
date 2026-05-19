import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let hypothesisId: string;

const BASE_HYPOTHESIS = {
  title: 'Onboarding simplificado aumenta ativação',
  if_clause: 'Se simplificarmos o onboarding para 3 passos',
  then_clause: 'Então a taxa de ativação aumentará em 20%',
  because_clause: 'Porque usuários abandonam no passo 4 (dados de analytics)',
};

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

describe('CRUD de hypotheses', () => {
  it('POST /products/:id/hypotheses cria e retorna 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/products/${productId}/hypotheses`,
      headers: authHeader(token),
      payload: { ...BASE_HYPOTHESIS, confidence: 3 },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.code).toMatch(/^HP-\d{2,}$/);
    expect(body.status).toBe('formulated');
    expect(body.if_clause).toBe(BASE_HYPOTHESIS.if_clause);
    hypothesisId = body.id;
  });

  it('GET /products/:id/hypotheses lista as hipóteses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/products/${productId}/hypotheses`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((h: { id: string }) => h.id === hypothesisId)).toBe(true);
    const hypothesis = body.find((h: { id: string }) => h.id === hypothesisId);
    expect(hypothesis.code).toMatch(/^HP-\d{2,}$/);
  });

  it('PATCH /hypotheses/:id/status faz a transição formulated → validating', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'validating' },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('validating');
  });

  it('PATCH /hypotheses/:id/status retorna 422 ao invalidar sem outcome_summary', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: { status: 'invalidated' },
    });

    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe('REASON_REQUIRED');
  });

  it('PATCH /hypotheses/:id/status invalida com outcome_summary', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/hypotheses/${hypothesisId}/status`,
      headers: authHeader(token),
      payload: {
        status: 'invalidated',
        outcome_summary: 'Experimento mostrou que o onboarding atual já é adequado para 80% dos usuários',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('invalidated');
    expect(body.outcome_summary).toBeTruthy();
  });

  it('POST /hypotheses/:id/clone cria cópia em formulated com cloned_from_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/hypotheses/${hypothesisId}/clone`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(201);
    const clone = JSON.parse(res.body);
    expect(clone.status).toBe('formulated');
    expect(clone.code).toMatch(/^HP-\d{2,}$/);
    expect(clone.cloned_from_id).toBe(hypothesisId);
    expect(clone.if_clause).toBe(BASE_HYPOTHESIS.if_clause);
  });
});
