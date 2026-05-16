import { PoolClient } from 'pg';
import type {
  ExperimentResult,
  ExperimentStatus,
  UpdateExperimentInput,
} from './experiments.schemas';

export interface Experiment {
  id: string;
  workspace_id: string;
  hypothesis_id: string;
  title: string;
  method: string;
  success_criteria: string;
  sample_target: number | null;
  sample_actual: number | null;
  status: ExperimentStatus;
  result: ExperimentResult | null;
  learnings: string | null;
  started_at: Date | null;
  ended_at: Date | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CreateExperimentData {
  workspace_id: string;
  hypothesis_id: string;
  title: string;
  method: string;
  success_criteria: string;
  sample_target?: number;
  owner_id?: string;
}

const UPDATABLE_FIELDS = [
  'title',
  'method',
  'success_criteria',
  'sample_target',
  'sample_actual',
  'learnings',
  'owner_id',
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findExperimentsByHypothesis(
  client: PoolClient,
  hypothesisId: string,
): Promise<Experiment[]> {
  const result = await client.query<Experiment>(
    `SELECT * FROM experiments
     WHERE hypothesis_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [hypothesisId],
  );
  return result.rows;
}

export async function findExperimentById(
  client: PoolClient,
  id: string,
): Promise<Experiment | null> {
  const result = await client.query<Experiment>(
    `SELECT * FROM experiments WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findHypothesisWorkspace(
  client: PoolClient,
  hypothesisId: string,
): Promise<{ workspace_id: string; product_id: string } | null> {
  const result = await client.query<{ workspace_id: string; product_id: string }>(
    `SELECT workspace_id, product_id FROM hypotheses
     WHERE id = $1 AND deleted_at IS NULL`,
    [hypothesisId],
  );
  return result.rows[0] ?? null;
}

export async function createExperiment(
  client: PoolClient,
  data: CreateExperimentData,
): Promise<Experiment> {
  const result = await client.query<Experiment>(
    `INSERT INTO experiments (
       workspace_id, hypothesis_id, title, method, success_criteria,
       sample_target, owner_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.workspace_id,
      data.hypothesis_id,
      data.title,
      data.method,
      data.success_criteria,
      data.sample_target ?? null,
      data.owner_id ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateExperiment(
  client: PoolClient,
  id: string,
  data: UpdateExperimentInput,
): Promise<Experiment | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findExperimentById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Experiment>(
    `UPDATE experiments SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING *`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function updateExperimentStatus(
  client: PoolClient,
  id: string,
  status: ExperimentStatus,
  resultValue?: ExperimentResult,
  learnings?: string,
): Promise<Experiment | null> {
  const startedAt = status === 'running' ? 'started_at = COALESCE(started_at, now()),' : '';
  const endedAt =
    status === 'completed' || status === 'analyzed'
      ? 'ended_at = COALESCE(ended_at, now()),'
      : '';

  const query = `
    UPDATE experiments
    SET status = $1::experiment_status,
        ${startedAt}
        ${endedAt}
        result = COALESCE($2::experiment_result, result),
        learnings = COALESCE($3, learnings)
    WHERE id = $4 AND deleted_at IS NULL
    RETURNING *
  `;

  const result = await client.query<Experiment>(query, [
    status,
    resultValue ?? null,
    learnings ?? null,
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function softDeleteExperiment(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE experiments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
