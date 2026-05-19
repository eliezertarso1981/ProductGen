import { PoolClient } from 'pg';
import type { CreateKeyResultInput, UpdateKeyResultInput } from './key-results.schemas';

export interface KeyResult {
  id: string;
  workspace_id: string;
  objective_id: string;
  code: string;
  title: string;
  metric_type: string | null;
  baseline: number | null;
  target: number | null;
  current_value: number | null;
  unit: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `id, workspace_id, objective_id, code, title, metric_type,
  baseline, target, current_value, unit, created_at, updated_at, deleted_at`;

const UPDATABLE_FIELDS = [
  'title',
  'metric_type',
  'baseline',
  'target',
  'current_value',
  'unit',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findObjectiveWorkspace(
  client: PoolClient,
  objectiveId: string,
): Promise<{ id: string } | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM objectives WHERE id = $1 AND deleted_at IS NULL`,
    [objectiveId],
  );
  return result.rows[0] ?? null;
}

export async function findKeyResultsByObjective(
  client: PoolClient,
  objectiveId: string,
): Promise<KeyResult[]> {
  const result = await client.query<KeyResult>(
    `SELECT ${SELECT_COLUMNS}
     FROM key_results
     WHERE objective_id = $1 AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [objectiveId],
  );
  return result.rows;
}

export async function findKeyResultById(client: PoolClient, id: string): Promise<KeyResult | null> {
  const result = await client.query<KeyResult>(
    `SELECT ${SELECT_COLUMNS}
     FROM key_results WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createKeyResult(
  client: PoolClient,
  data: CreateKeyResultInput & { workspace_id: string; objective_id: string },
): Promise<KeyResult> {
  const code = await nextKeyResultCode(client, data.objective_id);
  const result = await client.query<KeyResult>(
    `INSERT INTO key_results (
       workspace_id, objective_id, code, title, metric_type, baseline, target, current_value, unit
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.objective_id,
      code,
      data.title,
      data.metric_type ?? null,
      data.baseline ?? null,
      data.target ?? null,
      data.current_value ?? null,
      data.unit ?? null,
    ],
  );
  return result.rows[0];
}

async function nextKeyResultCode(client: PoolClient, objectiveId: string): Promise<string> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
    `key-results:${objectiveId}:code`,
  ]);
  const result = await client.query<{ code: string }>(
    `SELECT code FROM key_results
     WHERE objective_id = $1 AND code ~ '^KR-[0-9]+$'
     ORDER BY (substring(code from 4))::int DESC
     LIMIT 1`,
    [objectiveId],
  );
  const last = result.rows[0]?.code;
  const next = last ? Number.parseInt(last.slice(3), 10) + 1 : 1;
  return `KR-${String(next).padStart(2, '0')}`;
}

export async function updateKeyResult(
  client: PoolClient,
  id: string,
  data: UpdateKeyResultInput,
): Promise<KeyResult | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findKeyResultById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<KeyResult>(
    `UPDATE key_results SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteKeyResult(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE key_results SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
