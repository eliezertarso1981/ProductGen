import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import { computePriorityScore } from '../../shared/scoring';
import { parseScoringInput } from '../../shared/scoring.schemas';
import type { UpdateScoringInput } from '../../shared/scoring.schemas';
import {
  CreatePainInput,
  UpdatePainInput,
  UpdateStatusInput,
  MergePainsInput,
  SplitPainInput,
} from './pains.schemas';
import * as repo from './pains.repo';

export async function listPains(workspaceId: string, actorId: string, productId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPainsByProduct(client, productId),
  );
}

export async function getPain(workspaceId: string, actorId: string, id: string) {
  const pain = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPainById(client, id),
  );
  if (!pain) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
  return pain;
}

export async function createPain(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreatePainInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createPain(client, { workspace_id: workspaceId, product_id: productId, ...input }),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function updatePain(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdatePainInput,
) {
  try {
    const pain = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updatePain(client, id, input),
    );
    if (!pain) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    return pain;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionPainStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateStatusInput,
) {
  // Validação antecipada: o banco também valida, mas a mensagem de erro fica mais clara
  if (input.status === 'discarded' && !input.discard_reason?.trim()) {
    throw new AppError(422, 'REASON_REQUIRED', 'discard_reason é obrigatório ao descartar uma dor');
  }

  try {
    const pain = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updatePainStatus(client, id, input.status, input.discard_reason),
    );
    if (!pain) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    return pain;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deletePain(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeletePain(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
}

export async function updatePainScoring(
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
    const pain = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updatePainScoring(client, id, input.method, input.payload, priorityScore),
    );
    if (!pain) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    return pain;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function listPainRelationships(workspaceId: string, actorId: string, id: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const pain = await repo.findPainById(client, id);
    if (!pain) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    return repo.listPainRelationships(client, id);
  });
}

export async function mergePains(
  workspaceId: string,
  actorId: string,
  targetId: string,
  input: MergePainsInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const target = await repo.findPainById(client, targetId);
      if (!target) throw new AppError(404, 'NOT_FOUND', 'Dor alvo não encontrada');

      for (const sourceId of input.source_pain_ids) {
        if (sourceId === targetId) {
          throw new AppError(422, 'INVALID_MERGE', 'A dor alvo não pode ser origem do merge');
        }
        const source = await repo.findPainById(client, sourceId);
        if (!source) {
          throw new AppError(404, 'NOT_FOUND', `Dor de origem não encontrada: ${sourceId}`);
        }
        if (source.product_id !== target.product_id) {
          throw new AppError(422, 'INVALID_MERGE', 'Todas as dores devem ser do mesmo produto');
        }
      }

      return repo.mergePains(
        client,
        workspaceId,
        actorId,
        targetId,
        input.source_pain_ids,
        input.reason,
      );
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function splitPain(
  workspaceId: string,
  actorId: string,
  parentId: string,
  input: SplitPainInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const parent = await repo.findPainById(client, parentId);
      if (!parent) throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');

      return repo.splitPain(client, workspaceId, actorId, parent, input.children, input.reason);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export { parseScoringInput };
