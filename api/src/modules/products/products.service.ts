import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import { getPlanDefinition } from '../../config/plans';
import type { CreateProductInput, UpdateProductInput } from './products.schemas';
import * as repo from './products.repo';

export async function listProducts(workspaceId: string, actorId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findProductsByWorkspace(client, workspaceId),
  );
}

export async function getProduct(workspaceId: string, actorId: string, id: string) {
  const product = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findProductById(client, id),
  );
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  return product;
}

export async function createProduct(
  workspaceId: string,
  actorId: string,
  input: CreateProductInput,
) {
  try {
    const planResult = await pool.query<{ plan: string }>(
      `SELECT plan FROM workspaces WHERE id = $1 AND deleted_at IS NULL`,
      [workspaceId],
    );
    const planCode = planResult.rows[0]?.plan ?? 'free';
    const plan = getPlanDefinition(planCode) ?? getPlanDefinition('free');
    if (plan?.max_products != null) {
      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM products
         WHERE workspace_id = $1 AND deleted_at IS NULL`,
        [workspaceId],
      );
      const currentCount = Number(countResult.rows[0]?.count ?? 0);
      if (currentCount >= plan.max_products) {
        throw new AppError(
          403,
          'PLAN_LIMIT_EXCEEDED',
          `Plano ${plan.name} permite até ${plan.max_products} produto(s). Faça upgrade para Professional.`,
        );
      }
    }

    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const product = await repo.createProduct(client, { workspace_id: workspaceId, ...input });
      await client.query(
        `INSERT INTO product_members (product_id, workspace_id, user_id, role, added_by_user_id)
         VALUES ($1, $2, $3, 'owner', $3)
         ON CONFLICT (product_id, user_id) DO UPDATE
         SET role = 'owner'`,
        [product.id, workspaceId, actorId],
      );
      return product;
    });
  } catch (err) {
    mapDbError(err);
  }
}

export async function updateProduct(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateProductInput,
) {
  try {
    const product = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateProduct(client, id, input),
    );
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
    return product;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteProduct(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteProduct(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Product not found');
}
