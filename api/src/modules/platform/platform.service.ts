import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { EntityType } from '../../shared/entity-types';
import type {
  AttachAssetInput,
  CreateAssignmentInput,
  CreateCommentInput,
  CreateDecisionLogInput,
  CreateMediaAssetInput,
} from './platform.schemas';
import { ASSET_ATTACHABLE_TYPES } from './platform.schemas';
import * as repo from './platform.repo';

export async function listComments(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listComments(client, workspaceId, actorId, entityType, entityId),
  );
}

export async function createComment(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateCommentInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createComment(client, workspaceId, actorId, entityType, entityId, input),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function deleteComment(workspaceId: string, actorId: string, commentId: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteComment(client, workspaceId, commentId),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Comentário não encontrado');
}

export async function listAssignments(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listAssignments(client, workspaceId, entityType, entityId),
  );
}

export async function createAssignment(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateAssignmentInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createAssignment(client, workspaceId, actorId, entityType, entityId, input),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function closeAssignment(
  workspaceId: string,
  actorId: string,
  assignmentId: string,
) {
  const closed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.closeAssignment(client, workspaceId, assignmentId),
  );
  if (!closed) throw new AppError(404, 'NOT_FOUND', 'Atribuição não encontrada');
}

export async function listDecisionLogs(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listDecisionLogs(client, workspaceId, entityType, entityId),
  );
}

export async function createDecisionLog(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateDecisionLogInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createDecisionLog(client, workspaceId, actorId, entityType, entityId, input),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function deleteDecisionLog(
  workspaceId: string,
  actorId: string,
  decisionLogId: string,
) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteDecisionLog(client, workspaceId, decisionLogId),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Decisão não encontrada');
}

export async function listEntityEvents(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listEntityEvents(client, workspaceId, entityType, entityId),
  );
}

export async function listMediaAssets(workspaceId: string, actorId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listMediaAssets(client, workspaceId),
  );
}

export async function getMediaAsset(workspaceId: string, actorId: string, assetId: string) {
  const asset = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findMediaAssetById(client, workspaceId, assetId),
  );
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset não encontrado');
  return asset;
}

export async function createMediaAsset(
  workspaceId: string,
  actorId: string,
  input: CreateMediaAssetInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createMediaAsset(client, workspaceId, actorId, input),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function deleteMediaAsset(workspaceId: string, actorId: string, assetId: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteMediaAsset(client, workspaceId, assetId),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Asset não encontrado');
}

export async function listAssetAttachments(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
) {
  assertAttachableType(entityType);
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listAssetAttachments(client, workspaceId, entityType, entityId),
  );
}

export async function attachAssetToEntity(
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: AttachAssetInput,
) {
  assertAttachableType(entityType);

  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const asset = await repo.findMediaAssetById(client, workspaceId, input.asset_id);
      if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset não encontrado');
      return repo.attachAssetToEntity(client, workspaceId, actorId, entityType, entityId, input);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function detachAsset(workspaceId: string, actorId: string, attachmentId: string) {
  const detached = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.detachAsset(client, workspaceId, attachmentId),
  );
  if (!detached) throw new AppError(404, 'NOT_FOUND', 'Anexo não encontrado');
}

function assertAttachableType(entityType: EntityType) {
  if (!ASSET_ATTACHABLE_TYPES.includes(entityType as (typeof ASSET_ATTACHABLE_TYPES)[number])) {
    throw new AppError(422, 'UNSUPPORTED_ENTITY_TYPE', 'Este tipo de entidade não aceita assets');
  }
}

