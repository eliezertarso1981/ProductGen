import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type {
  CreateOutcomeInput,
  UpdateOutcomeInput,
  UpdateOutcomeStatusInput,
} from './outcomes.schemas';
import * as repo from './outcomes.repo';

export async function listOutcomesByRoadmapItem(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const item = await repo.findRoadmapItemWorkspace(client, roadmapItemId);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return repo.findOutcomesByRoadmapItem(client, roadmapItemId);
  });
}

export async function getOutcome(workspaceId: string, actorId: string, id: string) {
  const outcome = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findOutcomeById(client, id),
  );
  if (!outcome) throw new AppError(404, 'NOT_FOUND', 'Outcome não encontrado');
  return outcome;
}

export async function createOutcome(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
  input: CreateOutcomeInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const item = await repo.findRoadmapItemWorkspace(client, roadmapItemId);
      if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');

      return repo.createOutcome(client, {
        ...input,
        workspace_id: workspaceId,
        roadmap_item_id: roadmapItemId,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateOutcome(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateOutcomeInput,
) {
  try {
    const outcome = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateOutcome(client, id, input),
    );
    if (!outcome) throw new AppError(404, 'NOT_FOUND', 'Outcome não encontrado');
    return outcome;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionOutcomeStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateOutcomeStatusInput,
) {
  try {
    const outcome = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateOutcomeStatus(client, id, input.status),
    );
    if (!outcome) throw new AppError(404, 'NOT_FOUND', 'Outcome não encontrado');
    return outcome;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteOutcome(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteOutcome(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Outcome não encontrado');
}
