import { PoolClient } from 'pg';
import type { CreateReleaseInput, UpdateReleaseInput } from './releases.schemas';

export interface Release {
  id: string;
  workspace_id: string;
  product_id: string;
  version: string;
  title: string | null;
  description: string | null;
  planned_release_date: string | null;
  actual_release_date: string | null;
  changelog: string | null;
  created_at: Date;
}

const SELECT_COLUMNS = `id, workspace_id, product_id, version, title, description,
  planned_release_date, actual_release_date, changelog, created_at`;

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'planned_release_date',
  'actual_release_date',
  'changelog',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findProduct(
  client: PoolClient,
  productId: string,
): Promise<{ id: string } | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL`,
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function findReleasesByProduct(
  client: PoolClient,
  productId: string,
): Promise<Release[]> {
  const result = await client.query<Release>(
    `SELECT ${SELECT_COLUMNS}
     FROM releases WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId],
  );
  return result.rows;
}

export async function findReleaseById(client: PoolClient, id: string): Promise<Release | null> {
  const result = await client.query<Release>(
    `SELECT ${SELECT_COLUMNS} FROM releases WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createRelease(
  client: PoolClient,
  data: CreateReleaseInput & { workspace_id: string; product_id: string },
): Promise<Release> {
  const result = await client.query<Release>(
    `INSERT INTO releases (
       workspace_id, product_id, version, title, description,
       planned_release_date, actual_release_date, changelog
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.product_id,
      data.version,
      data.title ?? null,
      data.description ?? null,
      data.planned_release_date ?? null,
      data.actual_release_date ?? null,
      data.changelog ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateRelease(
  client: PoolClient,
  id: string,
  data: UpdateReleaseInput,
): Promise<Release | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return findReleaseById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Release>(
    `UPDATE releases SET ${setClauses} WHERE id = $${entries.length + 1}
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}
