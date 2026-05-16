import { PoolClient } from 'pg';

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  vision: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CreateProductData {
  workspace_id: string;
  name: string;
  vision?: string | null;
  metadata?: Record<string, unknown>;
}

const UPDATABLE_FIELDS = ['name', 'vision', 'metadata'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];
type UpdateFields = Partial<Record<UpdatableField, string | Record<string, unknown> | null>>;

export async function findProductsByWorkspace(
  client: PoolClient,
  workspaceId: string,
): Promise<Product[]> {
  const result = await client.query<Product>(
    `SELECT *
     FROM products
     WHERE workspace_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [workspaceId],
  );
  return result.rows;
}

export async function findProductById(
  client: PoolClient,
  id: string,
): Promise<Product | null> {
  const result = await client.query<Product>(
    `SELECT *
     FROM products
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createProduct(client: PoolClient, data: CreateProductData): Promise<Product> {
  const result = await client.query<Product>(
    `INSERT INTO products (workspace_id, name, vision, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      data.workspace_id,
      data.name,
      data.vision ?? null,
      data.metadata ?? {},
    ],
  );
  return result.rows[0];
}

export async function updateProduct(
  client: PoolClient,
  id: string,
  data: UpdateFields,
): Promise<Product | null> {
  const entries = (Object.entries(data) as Array<[UpdatableField, unknown]>).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return findProductById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Product>(
    `UPDATE products
     SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING *`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteProduct(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE products
     SET deleted_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
