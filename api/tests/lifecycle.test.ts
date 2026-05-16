import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;

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

describe('regras de lifecycle protegidas pelo banco', () => {
  it('nao valida hipotese sem experimento analisado e validado', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productId}/hypotheses`,
      headers: authHeader(token),
      payload: {
        title: 'Sugestoes guiadas reduzem retrabalho',
        if_clause: 'Se exibirmos sugestoes guiadas na criacao',
        then_clause: 'Entao o retrabalho no discovery caira',
        because_clause: 'Porque o time tera criterios mais claros antes de priorizar',
      },
    });
    const hypothesisId = JSON.parse(create.body).id;

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

    expect(validated.statusCode).toBe(422);
    expect(JSON.parse(validated.body).error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('nao planeja initiative sem hipotese validada vinculada', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
      payload: {
        type: 'initiative',
        title: 'Reduzir tempo ate primeiro valor',
      },
    });
    const initiativeId = JSON.parse(create.body).id;

    const planned = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${initiativeId}/status`,
      headers: authHeader(token),
      payload: { status: 'planned' },
    });

    expect(planned.statusCode).toBe(422);
    expect(JSON.parse(planned.body).error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('permite cancelar roadmap quando cancel_reason e informado', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/products/${productId}/roadmap`,
      headers: authHeader(token),
      payload: {
        type: 'feature',
        title: 'Filtro de evidencias duplicadas',
      },
    });
    const featureId = JSON.parse(create.body).id;

    const cancelled = await app.inject({
      method: 'PATCH',
      url: `/roadmap/${featureId}/status`,
      headers: authHeader(token),
      payload: {
        status: 'cancelled',
        cancel_reason: 'Perdeu prioridade depois da revisao trimestral',
      },
    });

    expect(cancelled.statusCode).toBe(200);
    const body = JSON.parse(cancelled.body);
    expect(body.status).toBe('cancelled');
    expect(body.cancel_reason).toBe('Perdeu prioridade depois da revisao trimestral');
  });
});
