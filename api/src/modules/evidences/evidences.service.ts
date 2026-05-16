import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import {
  type CreateEvidenceInput,
  type UpdateEvidenceInput,
  type UpdateEvidenceStatusInput,
} from './evidences.schemas';
import * as repo from './evidences.repo';

export async function listEvidencesByProduct(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findEvidencesByProduct(client, productId),
  );
}

export async function getEvidence(
  workspaceId: string,
  actorId: string,
  id: string,
) {
  const evidence = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findEvidenceById(client, workspaceId, id),
  );
  if (!evidence) throw new AppError(404, 'NOT_FOUND', 'Evidence não encontrada');
  return evidence;
}

export async function createEvidence(
  workspaceId: string,
  actorId: string,
  productId: string | null,
  input: CreateEvidenceInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createEvidence(client, {
        workspace_id: workspaceId,
        actor_id: actorId,
        product_id: productId,
        title: input.title,
        content: input.content,
        source: input.source,
        source_url: input.source_url ?? null,
        customer_identifier: input.customer_identifier ?? null,
        collected_at: input.collected_at,
        metadata: input.metadata ?? {},
      }),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function updateEvidence(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateEvidenceInput,
) {
  try {
    const evidence = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateEvidence(client, id, {
        ...input,
        collected_at: input.collected_at,
        metadata: input.metadata,
      }),
    );
    if (!evidence) throw new AppError(404, 'NOT_FOUND', 'Evidence não encontrada');
    return evidence;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionEvidenceStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateEvidenceStatusInput,
) {
  try {
    const evidence = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateEvidenceStatus(client, id, input.status),
    );
    if (!evidence) throw new AppError(404, 'NOT_FOUND', 'Evidence não encontrada');
    return evidence;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteEvidence(
  workspaceId: string,
  actorId: string,
  id: string,
) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteEvidence(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Evidence não encontrada');
}
