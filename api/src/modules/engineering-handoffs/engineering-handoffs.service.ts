import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreateHandoffInput, UpdateHandoffInput } from './engineering-handoffs.schemas';
import * as repo from './engineering-handoffs.repo';

export async function listHandoffsByRoadmapItem(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const item = await repo.findRoadmapItem(client, roadmapItemId);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return repo.findHandoffsByRoadmapItem(client, roadmapItemId);
  });
}

export async function getHandoff(workspaceId: string, actorId: string, id: string) {
  const handoff = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findHandoffById(client, id),
  );
  if (!handoff) throw new AppError(404, 'NOT_FOUND', 'Handoff não encontrado');
  return handoff;
}

export async function createHandoff(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
  input: CreateHandoffInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const item = await repo.findRoadmapItem(client, roadmapItemId);
      if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');

      return repo.createHandoff(client, {
        ...input,
        workspace_id: workspaceId,
        roadmap_item_id: roadmapItemId,
        created_by: actorId,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateHandoff(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateHandoffInput,
) {
  try {
    const handoff = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateHandoff(client, id, input),
    );
    if (!handoff) throw new AppError(404, 'NOT_FOUND', 'Handoff não encontrado');
    return handoff;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}
