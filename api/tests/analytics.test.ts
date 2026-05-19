import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let workspaceId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  productId = fixtures.product.id;
  workspaceId = fixtures.workspace.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);

  await seedDashboardData();
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('Analytics dashboard', () => {
  it('GET /analytics/dashboard retorna KPIs agregados do produto', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/analytics/dashboard?product_id=${productId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    expect(body.product_id).toBe(productId);
    expect(body.totals).toMatchObject({
      evidences: 2,
      pains: 2,
      hypotheses: 2,
      experiments: 2,
      roadmap_items: 2,
      insights: 1,
      outcomes: 2,
      objectives: 1,
      key_results: 1,
    });
    expect(countFor(body.pains_by_status, 'investigating')).toBe(1);
    expect(countFor(body.hypotheses_by_status, 'validated')).toBe(1);
    expect(countFor(body.experiment_results, 'validated')).toBe(1);
    expect(body.discovery_funnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'evidences', count: 2 }),
        expect.objectContaining({ key: 'confirmed_outcomes', count: 1 }),
      ]),
    );
    expect(body.health.hypothesis_invalidation_rate).toBe(50);
    expect(body.health.roadmap_strategic_coverage_rate).toBe(50);
    expect(body.upcoming_measurements[0]).toMatchObject({
      outcome_code: 'OC-02',
      roadmap_code: 'RM-02',
      status: 'measuring',
    });
    expect(body.upcoming_measurements[0]).not.toHaveProperty('id');
    expect(body.recent_activity[0]).not.toHaveProperty('entity_id');
  });

  it('GET /analytics/dashboard valida product_id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/analytics/dashboard?product_id=invalido',
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /analytics/dashboard filtra KPIs pelo período selecionado', async () => {
    await adminPool.query(
      `
        INSERT INTO evidences (workspace_id, product_id, code, title, content, source, status, collected_at)
        VALUES ($1, $2, 'EV-99', 'Evidência antiga', 'Conteúdo', 'interview', 'new', now() - interval '2 years')
      `,
      [workspaceId, productId],
    );

    const allTime = await app.inject({
      method: 'GET',
      url: `/analytics/dashboard?product_id=${productId}`,
      headers: authHeader(token),
    });
    const today = await app.inject({
      method: 'GET',
      url: `/analytics/dashboard?product_id=${productId}&period=today`,
      headers: authHeader(token),
    });

    expect(allTime.statusCode).toBe(200);
    expect(today.statusCode).toBe(200);
    expect(JSON.parse(allTime.body).totals.evidences).toBe(3);
    expect(JSON.parse(today.body).totals.evidences).toBe(2);
  });

  it('GET /analytics/dashboard valida período', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/analytics/dashboard?product_id=${productId}&period=ontem`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe('VALIDATION_ERROR');
  });
});

function countFor(rows: Array<{ status: string; count: number }>, status: string) {
  return rows.find((row) => row.status === status)?.count ?? 0;
}

async function seedDashboardData() {
  const painRows = await adminPool.query<{ id: string }>(
    `
      INSERT INTO pains (workspace_id, product_id, code, title, status, updated_at)
      VALUES
        ($1, $2, 'PN-01', 'Dor em investigação', 'investigating', now() - interval '10 days'),
        ($1, $2, 'PN-02', 'Dor priorizada', 'prioritized', now())
      RETURNING id
    `,
    [workspaceId, productId],
  );

  const hypothesisRows = await adminPool.query<{ id: string }>(
    `
      INSERT INTO hypotheses (
        workspace_id, product_id, code, title, if_clause, then_clause, because_clause,
        status, outcome_summary
      )
      VALUES
        ($1, $2, 'HP-01', 'Hipótese validada', 'Se A', 'Então B', 'Porque C', 'validated', NULL),
        ($1, $2, 'HP-02', 'Hipótese invalidada', 'Se D', 'Então E', 'Porque F', 'invalidated', 'Sem efeito')
      RETURNING id
    `,
    [workspaceId, productId],
  );

  await adminPool.query(
    `
      INSERT INTO evidences (workspace_id, product_id, code, title, content, source, status, collected_at)
      VALUES
        ($1, $2, 'EV-01', 'Evidência nova', 'Conteúdo', 'interview', 'new', now()),
        ($1, $2, 'EV-02', 'Evidência triada', 'Conteúdo', 'survey', 'triaged', now())
    `,
    [workspaceId, productId],
  );

  await adminPool.query(
    `
      INSERT INTO experiments (
        workspace_id, product_id, hypothesis_id, code, title, method, success_criteria,
        status, result
      )
      VALUES
        ($1, $2, $3, 'EX-01', 'Experimento validado', 'interview', 'Critério com tamanho suficiente', 'analyzed', 'validated'),
        ($1, $2, $4, 'EX-02', 'Experimento inconclusivo', 'survey', 'Critério com tamanho suficiente', 'analyzed', 'inconclusive')
    `,
    [workspaceId, productId, hypothesisRows.rows[0].id, hypothesisRows.rows[1].id],
  );

  await adminPool.query(
    `
      INSERT INTO insights (
        workspace_id, product_id, code, title, description, confidence_score,
        impact_score, frequency_score, evidence_count
      )
      VALUES ($1, $2, 'IN-01', 'Insight de teste', 'Descrição', 0.8, 0.7, 0.6, 2)
    `,
    [workspaceId, productId],
  );

  const roadmapRows = await adminPool.query<{ id: string }>(
    `
      INSERT INTO roadmap_items (workspace_id, product_id, code, type, title, status)
      VALUES
        ($1, $2, 'RM-01', 'feature', 'Entrega concluída', 'delivered'),
        ($1, $2, 'RM-02', 'feature', 'Entrega em medição', 'measuring_outcome')
      RETURNING id
    `,
    [workspaceId, productId],
  );

  await adminPool.query(
    `
      INSERT INTO hypothesis_roadmap_links (workspace_id, hypothesis_id, roadmap_item_id)
      VALUES ($1, $2, $3)
    `,
    [workspaceId, hypothesisRows.rows[0].id, roadmapRows.rows[1].id],
  );

  const objectiveRows = await adminPool.query<{ id: string }>(
    `
      INSERT INTO objectives (workspace_id, product_id, code, title, status)
      VALUES ($1, $2, 'OKR-01', 'Objetivo ativo', 'active')
      RETURNING id
    `,
    [workspaceId, productId],
  );

  await adminPool.query(
    `
      INSERT INTO key_results (
        workspace_id, objective_id, code, title, metric_type, baseline, target, current_value
      )
      VALUES ($1, $2, 'KR-01', 'KR ativo', 'percentual', 0, 100, 45)
    `,
    [workspaceId, objectiveRows.rows[0].id],
  );

  await adminPool.query(
    `
      INSERT INTO outcomes (
        workspace_id, roadmap_item_id, code, pain_id, hypothesized_impact,
        measurement_window_days, status, measurement_started_at
      )
      VALUES
        ($1, $2, 'OC-01', $4, 'Impacto confirmado para teste', 30, 'confirmed', now() - interval '40 days'),
        ($1, $3, 'OC-02', $4, 'Impacto em medição para teste', 7, 'measuring', now() + interval '1 day')
    `,
    [workspaceId, roadmapRows.rows[0].id, roadmapRows.rows[1].id, painRows.rows[0].id],
  );
}
