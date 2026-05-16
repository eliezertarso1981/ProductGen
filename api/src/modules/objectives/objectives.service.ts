import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type {
  CreateObjectiveInput,
  UpdateObjectiveInput,
  UpdateObjectiveStatusInput,
} from './objectives.schemas';
import * as repo from './objectives.repo';

export async function listObjectivesByProduct(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const product = await repo.findProductWorkspace(client, productId);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');
    return repo.findObjectivesByProduct(client, productId);
  });
}

export async function getObjective(workspaceId: string, actorId: string, id: string) {
  const objective = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findObjectiveById(client, id),
  );
  if (!objective) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
  return objective;
}

export async function createObjective(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateObjectiveInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const product = await repo.findProductWorkspace(client, productId);
      if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');

      return repo.createObjective(client, {
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

export async function updateObjective(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateObjectiveInput,
) {
  try {
    const objective = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateObjective(client, id, input),
    );
    if (!objective) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
    return objective;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionObjectiveStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateObjectiveStatusInput,
) {
  try {
    const objective = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateObjectiveStatus(client, id, input.status),
    );
    if (!objective) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
    return objective;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteObjective(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteObjective(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
}
