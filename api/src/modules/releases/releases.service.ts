import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreateReleaseInput, UpdateReleaseInput } from './releases.schemas';
import * as repo from './releases.repo';

export async function listReleasesByProduct(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const product = await repo.findProduct(client, productId);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');
    return repo.findReleasesByProduct(client, productId);
  });
}

export async function getRelease(workspaceId: string, actorId: string, id: string) {
  const release = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findReleaseById(client, id),
  );
  if (!release) throw new AppError(404, 'NOT_FOUND', 'Release não encontrada');
  return release;
}

export async function createRelease(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateReleaseInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const product = await repo.findProduct(client, productId);
      if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');

      return repo.createRelease(client, {
        ...input,
        workspace_id: workspaceId,
        product_id: productId,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateRelease(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateReleaseInput,
) {
  try {
    const release = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateRelease(client, id, input),
    );
    if (!release) throw new AppError(404, 'NOT_FOUND', 'Release não encontrada');
    return release;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}
