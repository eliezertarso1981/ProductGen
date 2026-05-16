import { PoolClient } from 'pg';
import type {
  CreateObjectiveInput,
  UpdateObjectiveInput,
  ObjectiveStatus,
} from './objectives.schemas';

export interface Objective {
  id: string;
  workspace_id: string;
  product_id: string;
  title: string;
  description: string | null;
  status: ObjectiveStatus;
  horizon_start: string | null;
  horizon_end: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `id, workspace_id, product_id, title, description, status,
  horizon_start, horizon_end, owner_id, created_at, updated_at, deleted_at`;

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'horizon_start',
  'horizon_end',
  'owner_id',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findProductWorkspace(
  client: PoolClient,
  productId: string,
): Promise<{ id: string } | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL`,
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function findObjectivesByProduct(
  client: PoolClient,
  productId: string,
): Promise<Objective[]> {
  const result = await client.query<Objective>(
    `SELECT ${SELECT_COLUMNS}
     FROM objectives
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [productId],
  );
  return result.rows;
}

export async function findObjectiveById(
  client: PoolClient,
  id: string,
): Promise<Objective | null> {
  const result = await client.query<Objective>(
    `SELECT ${SELECT_COLUMNS}
     FROM objectives WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createObjective(
  client: PoolClient,
  data: CreateObjectiveInput & { workspace_id: string; product_id: string },
): Promise<Objective> {
  const result = await client.query<Objective>(
    `INSERT INTO objectives (
       workspace_id, product_id, title, description, horizon_start, horizon_end, owner_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.product_id,
      data.title,
      data.description ?? null,
      data.horizon_start ?? null,
      data.horizon_end ?? null,
      data.owner_id ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateObjective(
  client: PoolClient,
  id: string,
  data: UpdateObjectiveInput,
): Promise<Objective | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findObjectiveById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Objective>(
    `UPDATE objectives SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function updateObjectiveStatus(
  client: PoolClient,
  id: string,
  status: ObjectiveStatus,
): Promise<Objective | null> {
  const result = await client.query<Objective>(
    `UPDATE objectives SET status = $1
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [status, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteObjective(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE objectives SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
