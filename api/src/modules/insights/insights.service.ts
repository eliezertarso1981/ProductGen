import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreateInsightInput, UpdateInsightInput } from './insights.schemas';
import * as repo from './insights.repo';

export async function listInsightsByProduct(
  workspaceId: string,
  actorId: string,
  productId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findInsightsByProduct(client, productId),
  );
}

export async function getInsight(workspaceId: string, actorId: string, id: string) {
  const insight = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findInsightById(client, id),
  );
  if (!insight) throw new AppError(404, 'NOT_FOUND', 'Insight não encontrado');
  return insight;
}

export async function createInsight(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateInsightInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createInsight(client, {
        ...input,
        workspace_id: workspaceId,
        product_id: productId,
      }),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function updateInsight(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateInsightInput,
) {
  try {
    const insight = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateInsight(client, id, input),
    );
    if (!insight) throw new AppError(404, 'NOT_FOUND', 'Insight não encontrado');
    return insight;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteInsight(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteInsight(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Insight não encontrado');
}

export async function linkEvidenceToInsight(
  workspaceId: string,
  actorId: string,
  insightId: string,
  evidenceId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const insight = await repo.findInsightById(client, insightId);
      if (!insight) throw new AppError(404, 'NOT_FOUND', 'Insight não encontrado');

      await repo.linkEvidence(client, workspaceId, actorId, insightId, evidenceId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkEvidenceFromInsight(
  workspaceId: string,
  actorId: string,
  insightId: string,
  evidenceId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkEvidence(client, insightId, evidenceId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}

export async function listInsightEvidences(
  workspaceId: string,
  actorId: string,
  insightId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const insight = await repo.findInsightById(client, insightId);
    if (!insight) throw new AppError(404, 'NOT_FOUND', 'Insight não encontrado');
    return repo.listLinkedEvidences(client, insightId);
  });
}
