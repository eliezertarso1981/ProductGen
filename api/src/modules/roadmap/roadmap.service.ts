import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import { computePriorityScore } from '../../shared/scoring';
import type { UpdateScoringInput } from '../../shared/scoring.schemas';
import { parseScoringInput } from '../../shared/scoring.schemas';
import {
  CreateRoadmapItemInput,
  UpdateRoadmapItemInput,
  UpdateRoadmapStatusInput,
} from './roadmap.schemas';
import * as repo from './roadmap.repo';

export async function listRoadmapItems(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findRoadmapItemsByProduct(client, productId),
  );
}

export async function getRoadmapItem(workspaceId: string, actorId: string, id: string) {
  const item = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findRoadmapItemById(client, id),
  );
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
  return item;
}

export async function createRoadmapItem(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateRoadmapItemInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createRoadmapItem(client, {
        workspace_id: workspaceId,
        product_id: productId,
        ...input,
      }),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function updateRoadmapItem(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateRoadmapItemInput,
) {
  try {
    const item = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateRoadmapItem(client, id, input),
    );
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return item;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionRoadmapStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateRoadmapStatusInput,
) {
  // Validação antecipada dos campos de motivo obrigatórios
  if (input.status === 'cancelled' && !input.cancel_reason?.trim()) {
    throw new AppError(422, 'REASON_REQUIRED', 'cancel_reason é obrigatório ao cancelar');
  }
  if (input.status === 'rolled_back' && !input.rollback_reason?.trim()) {
    throw new AppError(422, 'REASON_REQUIRED', 'rollback_reason é obrigatório ao fazer rollback');
  }

  try {
    const item = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateRoadmapItemStatus(
        client,
        id,
        input.status,
        input.cancel_reason,
        input.rollback_reason,
      ),
    );
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return item;
  } catch (err) {
    if (err instanceof AppError) throw err;
    // O banco valida proposed→planned para initiative/epic (exige hipótese vinculada)
    mapDbError(err);
  }
}

export async function updateRoadmapScoring(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateScoringInput,
) {
  const priorityScore = computePriorityScore(input.method, input.payload);
  if (priorityScore === null) {
    throw new AppError(422, 'INVALID_SCORING', 'Payload de scoring inválido para o método');
  }

  try {
    const item = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateRoadmapScoring(client, id, input.method, input.payload, priorityScore),
    );
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return item;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export { parseScoringInput };

export async function deleteRoadmapItem(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteRoadmapItem(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
}
