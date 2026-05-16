import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';

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

// Funil de conversão: evidência → pain → hipótese → outcome
export async function getDiscoveryFunnel(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_discovery_funnel',
      productId ? [{ column: 'product_id', value: productId }] : [],
    ),
  );
}

// Idade média e máxima por estado — detecta gargalos no fluxo
export async function getLifecycleHealth(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_lifecycle_health',
      productId ? [{ column: 'product_id', value: productId }] : [],
    ),
  );
}

// Taxa de invalidação de hipóteses — saúde do processo de discovery
export async function getHypothesisStats(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_hypothesis_validation_stats',
      productId ? [{ column: 'product_id', value: productId }] : [],
    ),
  );
}

// Roadmap com cobertura estratégica (pilar, OKR, hipótese)
export async function getRoadmapCoverage(
  workspaceId: string,
  actorId: string,
  productId?: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_roadmap_strategic_coverage',
      productId ? [{ column: 'product_id', value: productId }] : [],
    ),
  );
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
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    fromView(
      client,
      'v_outcomes_dashboard',
      productId ? [{ column: 'product_id', value: productId }] : [],
    ),
  );
}
