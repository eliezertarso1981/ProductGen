import { PoolClient } from 'pg';
import { HypothesisStatus } from './hypotheses.schemas';

export interface Hypothesis {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  title: string;
  if_clause: string;
  then_clause: string;
  because_clause: string;
  assumptions: unknown[];
  status: HypothesisStatus;
  confidence: number | null;
  outcome_summary: string | null;
  cloned_from_id: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CreateHypothesisData {
  workspace_id: string;
  product_id: string;
  title: string;
  if_clause: string;
  then_clause: string;
  because_clause: string;
  assumptions?: unknown[];
  confidence?: number;
  owner_id?: string;
  cloned_from_id?: string;
}

const UPDATABLE_FIELDS = [
  'title',
  'if_clause',
  'then_clause',
  'because_clause',
  'assumptions',
  'confidence',
  'outcome_summary',
  'owner_id',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];
type UpdateHypothesisData = Partial<Record<UpdatableField, unknown>>;

export async function findHypothesesByProduct(
  client: PoolClient,
  productId: string,
): Promise<Hypothesis[]> {
  const result = await client.query<Hypothesis>(
    `SELECT * FROM hypotheses
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [productId],
  );
  return result.rows;
}

export async function findHypothesisById(
  client: PoolClient,
  id: string,
): Promise<Hypothesis | null> {
  const result = await client.query<Hypothesis>(
    `SELECT * FROM hypotheses WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createHypothesis(
  client: PoolClient,
  data: CreateHypothesisData,
): Promise<Hypothesis> {
  const code = await nextHypothesisCode(client, data.product_id);
  const result = await client.query<Hypothesis>(
    `INSERT INTO hypotheses
       (workspace_id, product_id, code, title, if_clause, then_clause, because_clause,
        assumptions, confidence, owner_id, cloned_from_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.workspace_id,
      data.product_id,
      code,
      data.title,
      data.if_clause,
      data.then_clause,
      data.because_clause,
      JSON.stringify(data.assumptions ?? []),
      data.confidence ?? null,
      data.owner_id ?? null,
      data.cloned_from_id ?? null,
    ],
  );
  return result.rows[0];
}

async function nextHypothesisCode(client: PoolClient, productId: string): Promise<string> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
    `hypotheses:${productId}:code`,
  ]);
  const result = await client.query<{ code: string }>(
    `SELECT code FROM hypotheses
     WHERE product_id = $1 AND code ~ '^HP-[0-9]+$'
     ORDER BY (substring(code from 4))::int DESC
     LIMIT 1`,
    [productId],
  );
  const last = result.rows[0]?.code;
  const next = last ? Number.parseInt(last.slice(3), 10) + 1 : 1;
  return `HP-${String(next).padStart(2, '0')}`;
}

export async function updateHypothesis(
  client: PoolClient,
  id: string,
  data: UpdateHypothesisData,
): Promise<Hypothesis | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findHypothesisById(client, id);

  const setClauses = entries
    .map(([key], i) => {
      // assumptions é JSONB — cast explícito garante que arrays JS são serializados corretamente
      if (key === 'assumptions') return `${key} = $${i + 1}::jsonb`;
      return `${key} = $${i + 1}`;
    })
    .join(', ');

  const values = entries.map(([key, v]) =>
    key === 'assumptions' ? JSON.stringify(v) : v,
  );

  const result = await client.query<Hypothesis>(
    `UPDATE hypotheses SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING *`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function updateHypothesisStatus(
  client: PoolClient,
  id: string,
  status: HypothesisStatus,
  outcomeSummary?: string,
): Promise<Hypothesis | null> {
  const result = await client.query<Hypothesis>(
    `UPDATE hypotheses
     SET status = $1, outcome_summary = COALESCE($2, outcome_summary)
     WHERE id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [status, outcomeSummary ?? null, id],
  );
  return result.rows[0] ?? null;
}

export async function updateHypothesisScoring(
  client: PoolClient,
  id: string,
  method: string,
  payload: Record<string, unknown>,
  priorityScore: number | null,
): Promise<Hypothesis | null> {
  const result = await client.query<Hypothesis>(
    `UPDATE hypotheses
     SET scoring_method = $1,
         scoring_payload = $2::jsonb,
         priority_score = $3
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [method, JSON.stringify(payload), priorityScore, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteHypothesis(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE hypotheses SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
