import { PoolClient } from 'pg';
import type {
  CreateOutcomeInput,
  UpdateOutcomeInput,
  OutcomeStatus,
} from './outcomes.schemas';

export interface Outcome {
  id: string;
  workspace_id: string;
  roadmap_item_id: string;
  code: string;
  key_result_id: string | null;
  pain_id: string | null;
  hypothesized_impact: string;
  measurement_window_days: number;
  status: OutcomeStatus;
  measurement_started_at: Date | null;
  measurement_ended_at: Date | null;
  baseline_value: number | null;
  final_value: number | null;
  conclusion: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `id, workspace_id, roadmap_item_id, code, key_result_id, pain_id,
  hypothesized_impact, measurement_window_days, status,
  measurement_started_at, measurement_ended_at,
  baseline_value, final_value, conclusion,
  created_at, updated_at, deleted_at`;

const UPDATABLE_FIELDS = [
  'hypothesized_impact',
  'key_result_id',
  'pain_id',
  'measurement_window_days',
  'baseline_value',
  'final_value',
  'conclusion',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

function normalize(row: Outcome): Outcome {
  return {
    ...row,
    baseline_value: row.baseline_value != null ? Number(row.baseline_value) : null,
    final_value: row.final_value != null ? Number(row.final_value) : null,
  };
}

export async function findRoadmapItemWorkspace(
  client: PoolClient,
  roadmapItemId: string,
): Promise<{ id: string; product_id: string } | null> {
  const result = await client.query<{ id: string; product_id: string }>(
    `SELECT id, product_id FROM roadmap_items WHERE id = $1 AND deleted_at IS NULL`,
    [roadmapItemId],
  );
  return result.rows[0] ?? null;
}

export async function findOutcomesByRoadmapItem(
  client: PoolClient,
  roadmapItemId: string,
): Promise<Outcome[]> {
  const result = await client.query<Outcome>(
    `SELECT ${SELECT_COLUMNS}
     FROM outcomes
     WHERE roadmap_item_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [roadmapItemId],
  );
  return result.rows.map(normalize);
}

export async function findOutcomeById(client: PoolClient, id: string): Promise<Outcome | null> {
  const result = await client.query<Outcome>(
    `SELECT ${SELECT_COLUMNS}
     FROM outcomes WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function createOutcome(
  client: PoolClient,
  data: CreateOutcomeInput & { workspace_id: string; roadmap_item_id: string; product_id: string },
): Promise<Outcome> {
  const code = await nextOutcomeCode(client, data.product_id);
  const result = await client.query<Outcome>(
    `INSERT INTO outcomes (
       workspace_id, roadmap_item_id, code, key_result_id, pain_id,
       hypothesized_impact, measurement_window_days, baseline_value
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.roadmap_item_id,
      code,
      data.key_result_id ?? null,
      data.pain_id ?? null,
      data.hypothesized_impact,
      data.measurement_window_days ?? 30,
      data.baseline_value ?? null,
    ],
  );
  return normalize(result.rows[0]);
}

async function nextOutcomeCode(client: PoolClient, productId: string): Promise<string> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`outcomes:${productId}:code`]);
  const result = await client.query<{ code: string }>(
    `SELECT o.code
     FROM outcomes o
     JOIN roadmap_items ri ON ri.id = o.roadmap_item_id
     WHERE ri.product_id = $1
       AND o.code ~ '^OC-[0-9]+$'
     ORDER BY (substring(o.code from 4))::int DESC
     LIMIT 1`,
    [productId],
  );
  const last = result.rows[0]?.code;
  const next = last ? Number.parseInt(last.slice(3), 10) + 1 : 1;
  return `OC-${String(next).padStart(2, '0')}`;
}

export async function updateOutcome(
  client: PoolClient,
  id: string,
  data: UpdateOutcomeInput,
): Promise<Outcome | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findOutcomeById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Outcome>(
    `UPDATE outcomes SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function updateOutcomeStatus(
  client: PoolClient,
  id: string,
  status: OutcomeStatus,
): Promise<Outcome | null> {
  const result = await client.query<Outcome>(
    `UPDATE outcomes SET status = $1
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [status, id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function softDeleteOutcome(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE outcomes SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
