import { PoolClient } from 'pg';
import type { CreatePrdInput, PrdStatus, UpdatePrdInput } from './prds.schemas';

export interface Prd {
  id: string;
  workspace_id: string;
  roadmap_item_id: string;
  version: number;
  status: PrdStatus;
  title: string;
  content: string;
  assumptions: string | null;
  business_rules: string | null;
  non_functional_requirements: string | null;
  analytics_requirements: string | null;
  rollout_strategy: string | null;
  rollback_strategy: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `id, workspace_id, roadmap_item_id, version, status, title, content,
  assumptions, business_rules, non_functional_requirements, analytics_requirements,
  rollout_strategy, rollback_strategy, approved_by, approved_at, created_by,
  created_at, updated_at, deleted_at`;

const UPDATABLE_FIELDS = [
  'title',
  'content',
  'assumptions',
  'business_rules',
  'non_functional_requirements',
  'analytics_requirements',
  'rollout_strategy',
  'rollback_strategy',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findRoadmapItem(
  client: PoolClient,
  roadmapItemId: string,
): Promise<{ id: string } | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM roadmap_items WHERE id = $1 AND deleted_at IS NULL`,
    [roadmapItemId],
  );
  return result.rows[0] ?? null;
}

export async function findPrdsByRoadmapItem(
  client: PoolClient,
  roadmapItemId: string,
): Promise<Prd[]> {
  const result = await client.query<Prd>(
    `SELECT ${SELECT_COLUMNS}
     FROM prds
     WHERE roadmap_item_id = $1 AND deleted_at IS NULL
     ORDER BY version DESC`,
    [roadmapItemId],
  );
  return result.rows;
}

export async function findPrdById(client: PoolClient, id: string): Promise<Prd | null> {
  const result = await client.query<Prd>(
    `SELECT ${SELECT_COLUMNS} FROM prds WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getNextVersion(
  client: PoolClient,
  roadmapItemId: string,
): Promise<number> {
  const result = await client.query<{ max: number | null }>(
    `SELECT COALESCE(MAX(version), 0) + 1 AS max FROM prds WHERE roadmap_item_id = $1`,
    [roadmapItemId],
  );
  return Number(result.rows[0]?.max ?? 1);
}

export async function createPrd(
  client: PoolClient,
  data: CreatePrdInput & {
    workspace_id: string;
    roadmap_item_id: string;
    created_by: string;
  },
): Promise<Prd> {
  const version = await getNextVersion(client, data.roadmap_item_id);
  const result = await client.query<Prd>(
    `INSERT INTO prds (
       workspace_id, roadmap_item_id, version, title, content,
       assumptions, business_rules, non_functional_requirements,
       analytics_requirements, rollout_strategy, rollback_strategy, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.roadmap_item_id,
      version,
      data.title,
      data.content,
      data.assumptions ?? null,
      data.business_rules ?? null,
      data.non_functional_requirements ?? null,
      data.analytics_requirements ?? null,
      data.rollout_strategy ?? null,
      data.rollback_strategy ?? null,
      data.created_by,
    ],
  );
  return result.rows[0];
}

export async function updatePrd(
  client: PoolClient,
  id: string,
  data: UpdatePrdInput,
): Promise<Prd | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return findPrdById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Prd>(
    `UPDATE prds SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL AND status = 'draft'
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function countApprovedForRoadmap(
  client: PoolClient,
  roadmapItemId: string,
  excludePrdId?: string,
): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM prds
     WHERE roadmap_item_id = $1 AND status = 'approved' AND deleted_at IS NULL
       AND ($2::uuid IS NULL OR id != $2)`,
    [roadmapItemId, excludePrdId ?? null],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function updatePrdStatus(
  client: PoolClient,
  id: string,
  status: PrdStatus,
  actorId: string,
): Promise<Prd | null> {
  const approvedFields =
    status === 'approved'
      ? `, approved_by = $3, approved_at = now()`
      : status === 'draft'
        ? `, approved_by = NULL, approved_at = NULL`
        : '';

  const params =
    status === 'approved' ? [status, id, actorId] : [status, id];

  const result = await client.query<Prd>(
    `UPDATE prds SET status = $1${approvedFields}
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function softDeletePrd(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE prds SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
