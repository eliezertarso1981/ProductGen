import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreateKeyResultInput, UpdateKeyResultInput } from './key-results.schemas';
import * as repo from './key-results.repo';

export async function listKeyResultsByObjective(
  workspaceId: string,
  actorId: string,
  objectiveId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const objective = await repo.findObjectiveWorkspace(client, objectiveId);
    if (!objective) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
    return repo.findKeyResultsByObjective(client, objectiveId);
  });
}

export async function getKeyResult(workspaceId: string, actorId: string, id: string) {
  const keyResult = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findKeyResultById(client, id),
  );
  if (!keyResult) throw new AppError(404, 'NOT_FOUND', 'Key result não encontrado');
  return keyResult;
}

export async function createKeyResult(
  workspaceId: string,
  actorId: string,
  objectiveId: string,
  input: CreateKeyResultInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const objective = await repo.findObjectiveWorkspace(client, objectiveId);
      if (!objective) throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');

      return repo.createKeyResult(client, {
        ...input,
        workspace_id: workspaceId,
        objective_id: objectiveId,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateKeyResult(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateKeyResultInput,
) {
  try {
    const keyResult = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateKeyResult(client, id, input),
    );
    if (!keyResult) throw new AppError(404, 'NOT_FOUND', 'Key result não encontrado');
    return keyResult;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteKeyResult(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteKeyResult(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Key result não encontrado');
}
