import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type {
  CreateStrategicPillarInput,
  UpdateStrategicPillarInput,
} from './strategic-pillars.schemas';
import * as repo from './strategic-pillars.repo';

export async function listPillarsByProduct(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const product = await repo.findProductWorkspace(client, productId);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');
    return repo.findPillarsByProduct(client, productId);
  });
}

export async function getPillar(workspaceId: string, actorId: string, id: string) {
  const pillar = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPillarById(client, id),
  );
  if (!pillar) throw new AppError(404, 'NOT_FOUND', 'Pilar estratégico não encontrado');
  return pillar;
}

export async function createPillar(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateStrategicPillarInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const product = await repo.findProductWorkspace(client, productId);
      if (!product) throw new AppError(404, 'NOT_FOUND', 'Produto não encontrado');

      return repo.createPillar(client, {
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

export async function updatePillar(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateStrategicPillarInput,
) {
  try {
    const pillar = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updatePillar(client, id, input),
    );
    if (!pillar) throw new AppError(404, 'NOT_FOUND', 'Pilar estratégico não encontrado');
    return pillar;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deletePillar(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeletePillar(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Pilar estratégico não encontrado');
}
