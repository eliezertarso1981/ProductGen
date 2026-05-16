import { PoolClient } from 'pg';
import type {
  CreateStrategicPillarInput,
  UpdateStrategicPillarInput,
} from './strategic-pillars.schemas';

export interface StrategicPillar {
  id: string;
  workspace_id: string;
  product_id: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `id, workspace_id, product_id, name, description, color, position,
  created_at, updated_at, deleted_at`;

const UPDATABLE_FIELDS = ['name', 'description', 'color', 'position'] as const;
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

export async function findPillarsByProduct(
  client: PoolClient,
  productId: string,
): Promise<StrategicPillar[]> {
  const result = await client.query<StrategicPillar>(
    `SELECT ${SELECT_COLUMNS}
     FROM strategic_pillars
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY position ASC, created_at ASC`,
    [productId],
  );
  return result.rows;
}

export async function findPillarById(
  client: PoolClient,
  id: string,
): Promise<StrategicPillar | null> {
  const result = await client.query<StrategicPillar>(
    `SELECT ${SELECT_COLUMNS}
     FROM strategic_pillars WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createPillar(
  client: PoolClient,
  data: CreateStrategicPillarInput & {
    workspace_id: string;
    product_id: string;
  },
): Promise<StrategicPillar> {
  const result = await client.query<StrategicPillar>(
    `INSERT INTO strategic_pillars (workspace_id, product_id, name, description, color, position)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.product_id,
      data.name,
      data.description ?? null,
      data.color ?? null,
      data.position ?? 0,
    ],
  );
  return result.rows[0];
}

export async function updatePillar(
  client: PoolClient,
  id: string,
  data: UpdateStrategicPillarInput,
): Promise<StrategicPillar | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findPillarById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<StrategicPillar>(
    `UPDATE strategic_pillars SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeletePillar(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE strategic_pillars SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
