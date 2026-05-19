import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';

export interface AnalyticsStatusCount {
  status: string;
  count: number;
}

export const DASHBOARD_PERIODS = ['today', 'week', 'month', 'quarter', 'year'] as const;
export type DashboardAnalyticsPeriod = (typeof DASHBOARD_PERIODS)[number];

export interface DashboardAnalytics {
  product_id: string | null;
  generated_at: string;
  totals: {
    evidences: number;
    pains: number;
    hypotheses: number;
    experiments: number;
    roadmap_items: number;
    insights: number;
    outcomes: number;
    objectives: number;
    key_results: number;
  };
  evidences_by_status: AnalyticsStatusCount[];
  pains_by_status: AnalyticsStatusCount[];
  hypotheses_by_status: AnalyticsStatusCount[];
  experiments_by_status: AnalyticsStatusCount[];
  experiment_results: AnalyticsStatusCount[];
  roadmap_by_status: AnalyticsStatusCount[];
  outcomes_by_status: AnalyticsStatusCount[];
  objectives_by_status: AnalyticsStatusCount[];
  discovery_funnel: Array<{
    key: string;
    label: string;
    count: number;
    conversion_rate: number | null;
  }>;
  health: {
    hypothesis_invalidation_rate: number | null;
    avg_investigating_pain_age_days: number | null;
    roadmap_strategic_coverage_rate: number | null;
  };
  upcoming_measurements: Array<{
    outcome_code: string;
    roadmap_code: string;
    roadmap_title: string;
    hypothesized_impact: string;
    status: string;
    due_at: string;
  }>;
  recent_activity: Array<{
    entity_type: string;
    event_type: string;
    code: string | null;
    title: string | null;
    actor_name: string | null;
    to_status: string | null;
    occurred_at: string;
  }>;
}

// viewName e column são sempre valores hardcoded do código — nunca vêm do usuário.
// Por isso a interpolação na query é segura aqui.
type ViewName =
  | 'v_discovery_funnel'
  | 'v_lifecycle_health'
  | 'v_hypothesis_validation_stats'
  | 'v_roadmap_strategic_coverage'
  | 'v_pain_traceability'
  | 'v_status_transitions'
  | 'v_cycle_times'
  | 'v_outcomes_dashboard';

async function fromView(
  client: PoolClient,
  view: ViewName,
  filters: Array<{ column: string; value: string }> = [],
): Promise<Record<string, unknown>[]> {
  if (filters.length === 0) {
    const r = await client.query(`SELECT * FROM ${view}`);
    return r.rows;
  }
  const where = filters.map((f, i) => `${f.column} = $${i + 1}`).join(' AND ');
  const r = await client.query(`SELECT * FROM ${view} WHERE ${where}`, filters.map((f) => f.value));
  return r.rows;
}

function toStatusCounts(rows: Array<{ status: string; count: number | string }>) {
  return rows.map((row) => ({ status: row.status, count: Number(row.count) }));
}

function sumCounts(rows: AnalyticsStatusCount[]) {
  return rows.reduce((total, row) => total + row.count, 0);
}

function rate(part: number, total: number) {
  if (total === 0) return null;
  return Math.round((part / total) * 100);
}

function periodRange(period?: DashboardAnalyticsPeriod) {
  if (!period) return null;
  const unit = period === 'today' ? 'day' : period;
  const interval = period === 'quarter' ? '3 months' : `1 ${unit}`;
  return {
    start: `date_trunc('${unit}', now())`,
    end: `date_trunc('${unit}', now()) + interval '${interval}'`,
  };
}

function periodFilter(period: DashboardAnalyticsPeriod | undefined, column: string) {
  const range = periodRange(period);
  if (!range) return '';
  return `AND ${column} >= ${range.start} AND ${column} < ${range.end}`;
}

async function countByStatus(
  client: PoolClient,
  table: 'evidences' | 'pains' | 'hypotheses' | 'experiments' | 'roadmap_items' | 'objectives',
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
  dateColumn = 'created_at',
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND product_id = $2' : '';
  const result = await client.query<{ status: string; count: number }>(
    `
      SELECT status::text, COUNT(*)::int AS count
      FROM ${table}
      WHERE workspace_id = $1
        AND deleted_at IS NULL
        ${productFilter}
        ${periodFilter(period, dateColumn)}
      GROUP BY status
      ORDER BY status
    `,
    params,
  );

  return toStatusCounts(result.rows);
}

async function countOutcomesByStatus(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND r.product_id = $2' : '';
  const result = await client.query<{ status: string; count: number }>(
    `
      SELECT o.status::text AS status, COUNT(*)::int AS count
      FROM outcomes o
      JOIN roadmap_items r ON r.id = o.roadmap_item_id
      WHERE o.workspace_id = $1
        AND o.deleted_at IS NULL
        AND r.deleted_at IS NULL
        ${productFilter}
        ${periodFilter(period, 'o.created_at')}
      GROUP BY o.status
      ORDER BY o.status
    `,
    params,
  );

  return toStatusCounts(result.rows);
}

async function countExperimentResults(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND product_id = $2' : '';
  const result = await client.query<{ status: string; count: number }>(
    `
      SELECT result::text AS status, COUNT(*)::int AS count
      FROM experiments
      WHERE workspace_id = $1
        AND deleted_at IS NULL
        AND result IS NOT NULL
        ${productFilter}
        ${periodFilter(period, 'created_at')}
      GROUP BY result
      ORDER BY result
    `,
    params,
  );

  return toStatusCounts(result.rows);
}

async function countInsights(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND product_id = $2' : '';
  const result = await client.query<{ count: number }>(
    `
      SELECT COUNT(*)::int AS count
      FROM insights
      WHERE workspace_id = $1
        AND deleted_at IS NULL
        ${productFilter}
        ${periodFilter(period, 'created_at')}
    `,
    params,
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function countKeyResults(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND o.product_id = $2' : '';
  const result = await client.query<{ count: number }>(
    `
      SELECT COUNT(*)::int AS count
      FROM key_results kr
      JOIN objectives o ON o.id = kr.objective_id
      WHERE kr.workspace_id = $1
        AND kr.deleted_at IS NULL
        AND o.deleted_at IS NULL
        ${productFilter}
        ${periodFilter(period, 'kr.created_at')}
    `,
    params,
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function getHealthMetrics(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND product_id = $2' : '';
  const hypothesisResult = await client.query<{
    validated: number;
    invalidated: number;
  }>(
    `
      SELECT
        COUNT(*) FILTER (WHERE status = 'validated')::int AS validated,
        COUNT(*) FILTER (WHERE status = 'invalidated')::int AS invalidated
      FROM hypotheses
      WHERE workspace_id = $1
        AND deleted_at IS NULL
        ${productFilter}
        ${periodFilter(period, 'created_at')}
    `,
    params,
  );
  const hypothesis = hypothesisResult.rows[0] ?? { validated: 0, invalidated: 0 };
  const decidedHypotheses = Number(hypothesis.validated) + Number(hypothesis.invalidated);

  const painAgeResult = await client.query<{ avg_days: number | string | null }>(
    `
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (now() - updated_at)) / 86400))::int AS avg_days
      FROM pains
      WHERE workspace_id = $1
        AND deleted_at IS NULL
        AND status = 'investigating'
        ${productFilter}
        ${periodFilter(period, 'created_at')}
    `,
    params,
  );

  const coverageResult = await client.query<{ covered: number; total: number }>(
    `
      SELECT
        COUNT(*) FILTER (
          WHERE r.pillar_id IS NOT NULL
             OR EXISTS (
               SELECT 1 FROM roadmap_pillar_links rpl
               WHERE rpl.roadmap_item_id = r.id
             )
             OR EXISTS (
               SELECT 1 FROM hypothesis_roadmap_links hrl
               WHERE hrl.roadmap_item_id = r.id
             )
        )::int AS covered,
        COUNT(*)::int AS total
      FROM roadmap_items r
      WHERE r.workspace_id = $1
        AND r.deleted_at IS NULL
        ${productFilter.replace('product_id', 'r.product_id')}
        ${periodFilter(period, 'r.created_at')}
    `,
    params,
  );
  const coverage = coverageResult.rows[0] ?? { covered: 0, total: 0 };

  return {
    hypothesis_invalidation_rate: rate(Number(hypothesis.invalidated), decidedHypotheses),
    avg_investigating_pain_age_days:
      painAgeResult.rows[0]?.avg_days == null ? null : Number(painAgeResult.rows[0].avg_days),
    roadmap_strategic_coverage_rate: rate(Number(coverage.covered), Number(coverage.total)),
  };
}

async function getUpcomingMeasurements(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId ? 'AND r.product_id = $2' : '';
  const dueExpression = `
    (
      COALESCE(o.measurement_started_at, o.created_at)
      + (o.measurement_window_days || ' days')::interval
    )
  `;
  const result = await client.query<DashboardAnalytics['upcoming_measurements'][number]>(
    `
      SELECT
        o.code AS outcome_code,
        r.code AS roadmap_code,
        r.title AS roadmap_title,
        o.hypothesized_impact,
        o.status::text AS status,
        ${dueExpression}::timestamptz AS due_at
      FROM outcomes o
      JOIN roadmap_items r ON r.id = o.roadmap_item_id
      WHERE o.workspace_id = $1
        AND o.deleted_at IS NULL
        AND r.deleted_at IS NULL
        AND o.status IN ('hypothesized', 'measuring')
        ${productFilter}
        ${periodFilter(period, dueExpression)}
      ORDER BY due_at ASC
      LIMIT 5
    `,
    params,
  );

  return result.rows.map((row) => ({
    ...row,
    due_at: new Date(row.due_at).toISOString(),
  }));
}

async function getRecentActivity(
  client: PoolClient,
  workspaceId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
) {
  const params = productId ? [workspaceId, productId] : [workspaceId];
  const productFilter = productId
    ? `AND (
        p.product_id = $2 OR h.product_id = $2 OR ex.product_id = $2 OR ev.product_id = $2
        OR r.product_id = $2 OR i.product_id = $2 OR obj.product_id = $2 OR ro.product_id = $2
      )`
    : '';
  const result = await client.query<DashboardAnalytics['recent_activity'][number]>(
    `
      SELECT
        ee.entity_type,
        ee.event_type,
        COALESCE(p.code, h.code, ex.code, ev.code, r.code, i.code, obj.code, o.code) AS code,
        COALESCE(
          p.title,
          h.title,
          ex.title,
          ev.title,
          r.title,
          i.title,
          obj.title,
          o.hypothesized_impact
        ) AS title,
        u.name AS actor_name,
        ee.to_status,
        ee.occurred_at
      FROM entity_events ee
      LEFT JOIN users u ON u.id = ee.actor_id
      LEFT JOIN pains p ON ee.entity_type = 'pains' AND p.id = ee.entity_id
      LEFT JOIN hypotheses h ON ee.entity_type = 'hypotheses' AND h.id = ee.entity_id
      LEFT JOIN experiments ex ON ee.entity_type = 'experiments' AND ex.id = ee.entity_id
      LEFT JOIN evidences ev ON ee.entity_type = 'evidences' AND ev.id = ee.entity_id
      LEFT JOIN roadmap_items r ON ee.entity_type = 'roadmap_items' AND r.id = ee.entity_id
      LEFT JOIN insights i ON ee.entity_type = 'insights' AND i.id = ee.entity_id
      LEFT JOIN objectives obj ON ee.entity_type = 'objectives' AND obj.id = ee.entity_id
      LEFT JOIN outcomes o ON ee.entity_type = 'outcomes' AND o.id = ee.entity_id
      LEFT JOIN roadmap_items ro ON ro.id = o.roadmap_item_id
      WHERE ee.workspace_id = $1
        ${productFilter}
        ${periodFilter(period, 'ee.occurred_at')}
      ORDER BY ee.occurred_at DESC
      LIMIT 5
    `,
    params,
  );

  return result.rows.map((row) => ({
    ...row,
    occurred_at: new Date(row.occurred_at).toISOString(),
  }));
}

function buildDiscoveryFunnel(input: {
  evidences: AnalyticsStatusCount[];
  pains: AnalyticsStatusCount[];
  hypotheses: AnalyticsStatusCount[];
  roadmap: AnalyticsStatusCount[];
  outcomes: AnalyticsStatusCount[];
}) {
  const evidenceTotal = sumCounts(input.evidences);
  const evidenceTriaged = input.evidences
    .filter((row) => ['triaged', 'linked'].includes(row.status))
    .reduce((total, row) => total + row.count, 0);
  const painTotal = sumCounts(input.pains);
  const painPrioritized = input.pains.find((row) => row.status === 'prioritized')?.count ?? 0;
  const hypothesisTotal = sumCounts(input.hypotheses);
  const hypothesisValidated = input.hypotheses.find((row) => row.status === 'validated')?.count ?? 0;
  const delivered = input.roadmap
    .filter((row) => ['delivered', 'measuring_outcome'].includes(row.status))
    .reduce((total, row) => total + row.count, 0);
  const confirmed = input.outcomes.find((row) => row.status === 'confirmed')?.count ?? 0;

  const stages = [
    { key: 'evidences', label: 'Evidências capturadas', count: evidenceTotal },
    { key: 'triaged_evidences', label: 'Triadas ou vinculadas', count: evidenceTriaged },
    { key: 'pains', label: 'Dores formuladas', count: painTotal },
    { key: 'prioritized_pains', label: 'Dores priorizadas', count: painPrioritized },
    { key: 'hypotheses', label: 'Hipóteses', count: hypothesisTotal },
    { key: 'validated_hypotheses', label: 'Hipóteses validadas', count: hypothesisValidated },
    { key: 'delivered_roadmap', label: 'Entregas concluídas', count: delivered },
    { key: 'confirmed_outcomes', label: 'Outcomes confirmados', count: confirmed },
  ];

  return stages.map((stage, index) => ({
    ...stage,
    conversion_rate: index === 0 ? null : rate(stage.count, stages[index - 1].count),
  }));
}

export async function getDashboardAnalytics(
  workspaceId: string,
  actorId: string,
  productId?: string,
  period?: DashboardAnalyticsPeriod,
): Promise<DashboardAnalytics> {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const evidences = await countByStatus(client, 'evidences', workspaceId, productId, period, 'collected_at');
    const pains = await countByStatus(client, 'pains', workspaceId, productId, period);
    const hypotheses = await countByStatus(client, 'hypotheses', workspaceId, productId, period);
    const experiments = await countByStatus(client, 'experiments', workspaceId, productId, period);
    const experimentResults = await countExperimentResults(client, workspaceId, productId, period);
    const roadmap = await countByStatus(client, 'roadmap_items', workspaceId, productId, period);
    const outcomes = await countOutcomesByStatus(client, workspaceId, productId, period);
    const objectives = await countByStatus(client, 'objectives', workspaceId, productId, period);
    const insights = await countInsights(client, workspaceId, productId, period);
    const keyResults = await countKeyResults(client, workspaceId, productId, period);
    const health = await getHealthMetrics(client, workspaceId, productId, period);
    const upcomingMeasurements = await getUpcomingMeasurements(client, workspaceId, productId, period);
    const recentActivity = await getRecentActivity(client, workspaceId, productId, period);

    return {
      product_id: productId ?? null,
      generated_at: new Date().toISOString(),
      totals: {
        evidences: sumCounts(evidences),
        pains: sumCounts(pains),
        hypotheses: sumCounts(hypotheses),
        experiments: sumCounts(experiments),
        roadmap_items: sumCounts(roadmap),
        insights,
        outcomes: sumCounts(outcomes),
        objectives: sumCounts(objectives),
        key_results: keyResults,
      },
      evidences_by_status: evidences,
      pains_by_status: pains,
      hypotheses_by_status: hypotheses,
      experiments_by_status: experiments,
      experiment_results: experimentResults,
      roadmap_by_status: roadmap,
      outcomes_by_status: outcomes,
      objectives_by_status: objectives,
      discovery_funnel: buildDiscoveryFunnel({
        evidences,
        pains,
        hypotheses,
        roadmap,
        outcomes,
      }),
      health,
      upcoming_measurements: upcomingMeasurements,
      recent_activity: recentActivity,
    };
  });
}

// Funil de conversão: evidência → pain → hipótese → outcome
export async function getDiscoveryFunnel(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) =>
    buildDiscoveryFunnel({
      evidences: await countByStatus(client, 'evidences', workspaceId, productId),
      pains: await countByStatus(client, 'pains', workspaceId, productId),
      hypotheses: await countByStatus(client, 'hypotheses', workspaceId, productId),
      roadmap: await countByStatus(client, 'roadmap_items', workspaceId, productId),
      outcomes: await countOutcomesByStatus(client, workspaceId, productId),
    }),
  );
}

// Idade média e máxima por estado — detecta gargalos no fluxo
export async function getLifecycleHealth(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => [
    await getHealthMetrics(client, workspaceId, productId),
  ]);
}

// Taxa de invalidação de hipóteses — saúde do processo de discovery
export async function getHypothesisStats(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const rows = await countByStatus(client, 'hypotheses', workspaceId, productId);
    const validated = rows.find((row) => row.status === 'validated')?.count ?? 0;
    const invalidated = rows.find((row) => row.status === 'invalidated')?.count ?? 0;
    return [
      {
        validated,
        invalidated,
        invalidation_rate: rate(invalidated, validated + invalidated),
      },
    ];
  });
}

// Roadmap com cobertura estratégica (pilar, OKR, hipótese)
export async function getRoadmapCoverage(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const health = await getHealthMetrics(client, workspaceId, productId);
    const roadmapByStatus = await countByStatus(client, 'roadmap_items', workspaceId, productId);
    return [
      {
        strategic_coverage_rate: health.roadmap_strategic_coverage_rate,
        total_roadmap_items: sumCounts(roadmapByStatus),
        by_status: roadmapByStatus,
      },
    ];
  });
}

// Drill-down completo de uma dor: evidências, hipóteses, experimentos, outcomes
export async function getPainTraceability(workspaceId: string, actorId: string, painId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(client, 'v_pain_traceability', [{ column: 'pain_id', value: painId }]),
  );
}

// Histórico de transições de status com tempo gasto em cada estado
export async function getStatusTransitions(
  workspaceId: string,
  actorId: string,
  filters: { entity_type?: string; entity_id?: string },
) {
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v != null)
    .map(([column, value]) => ({ column, value: value as string }));

  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(client, 'v_status_transitions', activeFilters),
  );
}

// Cycle time agregado por estado (quanto tempo cada tipo de item passa em cada fase)
export async function getCycleTimes(
  workspaceId: string,
  actorId: string,
  entityType?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_cycle_times',
      entityType ? [{ column: 'entity_type', value: entityType }] : [],
    ),
  );
}

// Dashboard de outcomes: fechamento do loop entre entrega e resultado medido
export async function getOutcomesDashboard(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => [
    {
      by_status: await countOutcomesByStatus(client, workspaceId, productId),
      upcoming_measurements: await getUpcomingMeasurements(client, workspaceId, productId),
    },
  ]);
}
