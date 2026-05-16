import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreatePrdInput, UpdatePrdInput, UpdatePrdStatusInput } from './prds.schemas';
import * as repo from './prds.repo';

export async function listPrdsByRoadmapItem(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const item = await repo.findRoadmapItem(client, roadmapItemId);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
    return repo.findPrdsByRoadmapItem(client, roadmapItemId);
  });
}

export async function getPrd(workspaceId: string, actorId: string, id: string) {
  const prd = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPrdById(client, id),
  );
  if (!prd) throw new AppError(404, 'NOT_FOUND', 'PRD não encontrado');
  return prd;
}

export async function createPrd(
  workspaceId: string,
  actorId: string,
  roadmapItemId: string,
  input: CreatePrdInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const item = await repo.findRoadmapItem(client, roadmapItemId);
      if (!item) throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');

      return repo.createPrd(client, {
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

export async function updatePrd(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdatePrdInput,
) {
  try {
    const prd = await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const existing = await repo.findPrdById(client, id);
      if (!existing) return null;
      if (existing.status !== 'draft') {
        throw new AppError(422, 'PRD_NOT_EDITABLE', 'Apenas PRDs em draft podem ser editados');
      }
      return repo.updatePrd(client, id, input);
    });
    if (!prd) throw new AppError(404, 'NOT_FOUND', 'PRD não encontrado');
    return prd;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionPrdStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdatePrdStatusInput,
) {
  try {
    const prd = await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const existing = await repo.findPrdById(client, id);
      if (!existing) return null;

      if (input.status === 'approved') {
        const approvedCount = await repo.countApprovedForRoadmap(
          client,
          existing.roadmap_item_id,
          id,
        );
        if (approvedCount > 0) {
          throw new AppError(
            422,
            'PRD_APPROVAL_CONFLICT',
            'Já existe um PRD aprovado para este item de roadmap',
          );
        }
      }

      return repo.updatePrdStatus(client, id, input.status, actorId);
    });
    if (!prd) throw new AppError(404, 'NOT_FOUND', 'PRD não encontrado');
    return prd;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deletePrd(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeletePrd(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'PRD não encontrado');
}
