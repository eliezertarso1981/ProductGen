import { PoolClient } from 'pg';
import type { EntityType } from '../../shared/entity-types';
import type {
  AttachAssetInput,
  CreateAssignmentInput,
  CreateCommentInput,
  CreateDecisionLogInput,
  CreateMediaAssetInput,
} from './platform.schemas';

export interface CommentRow {
  id: string;
  workspace_id: string;
  entity_type: EntityType;
  entity_id: string;
  parent_comment_id: string | null;
  content: string;
  visibility: string;
  created_by: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface AssignmentRow {
  id: string;
  workspace_id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string | null;
  squad_id: string | null;
  assignment_role: string;
  assigned_by: string | null;
  assigned_at: Date;
  unassigned_at: Date | null;
  is_primary: boolean;
  metadata: unknown;
}

export interface DecisionLogRow {
  id: string;
  workspace_id: string;
  entity_type: EntityType;
  entity_id: string;
  decision_type: string;
  title: string;
  rationale: string;
  impact_analysis: string | null;
  decided_by: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface EntityEventRow {
  id: string;
  workspace_id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  changed_fields: string[] | null;
  payload: unknown;
  actor_id: string | null;
  actor_type: string | null;
  occurred_at: Date;
}

export interface MediaAssetRow {
  id: string;
  workspace_id: string;
  filename: string;
  mime_type: string;
  size_bytes: string;
  checksum_sha256: string | null;
  storage_provider: string;
  storage_bucket: string;
  storage_key: string;
  asset_type: string | null;
  thumbnail_key: string | null;
  transcript: string | null;
  metadata: unknown;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface AssetAttachmentRow {
  id: string;
  asset_id: string;
  attachable_type: string;
  attachable_id: string;
  workspace_id: string;
  role: string | null;
  position: number;
  attached_by: string | null;
  created_at: Date;
}

export async function listComments(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
): Promise<CommentRow[]> {
  const result = await client.query<CommentRow>(
    `SELECT id, workspace_id, entity_type, entity_id, parent_comment_id,
            content, visibility, created_by, created_at, deleted_at
     FROM comments
     WHERE workspace_id = $1
       AND entity_type = $2
       AND entity_id = $3
       AND deleted_at IS NULL
       AND (visibility = 'public' OR created_by = $4)
     ORDER BY created_at ASC`,
    [workspaceId, entityType, entityId, actorId],
  );
  return result.rows;
}

export async function createComment(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateCommentInput,
): Promise<CommentRow> {
  const result = await client.query<CommentRow>(
    `INSERT INTO comments (
       workspace_id, entity_type, entity_id, parent_comment_id,
       content, visibility, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, workspace_id, entity_type, entity_id, parent_comment_id,
               content, visibility, created_by, created_at, deleted_at`,
    [
      workspaceId,
      entityType,
      entityId,
      input.parent_comment_id ?? null,
      input.content,
      input.visibility ?? 'public',
      actorId,
    ],
  );
  return result.rows[0];
}

export async function softDeleteComment(
  client: PoolClient,
  workspaceId: string,
  commentId: string,
): Promise<boolean> {
  const result = await client.query(
    `UPDATE comments SET deleted_at = now()
     WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
    [commentId, workspaceId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listAssignments(
  client: PoolClient,
  workspaceId: string,
  entityType: EntityType,
  entityId: string,
): Promise<AssignmentRow[]> {
  const result = await client.query<AssignmentRow>(
    `SELECT id, workspace_id, entity_type, entity_id, user_id, squad_id,
            assignment_role, assigned_by, assigned_at, unassigned_at,
            is_primary, metadata
     FROM entity_assignments
     WHERE workspace_id = $1
       AND entity_type = $2
       AND entity_id = $3
       AND unassigned_at IS NULL
     ORDER BY is_primary DESC, assigned_at DESC`,
    [workspaceId, entityType, entityId],
  );
  return result.rows;
}

export async function createAssignment(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateAssignmentInput,
): Promise<AssignmentRow> {
  if (input.is_primary) {
    await client.query(
      `UPDATE entity_assignments
       SET unassigned_at = now()
       WHERE workspace_id = $1
         AND entity_type = $2
         AND entity_id = $3
         AND assignment_role = $4
         AND is_primary = true
         AND unassigned_at IS NULL`,
      [workspaceId, entityType, entityId, input.assignment_role],
    );
  }

  const result = await client.query<AssignmentRow>(
    `INSERT INTO entity_assignments (
       workspace_id, entity_type, entity_id, user_id, squad_id,
       assignment_role, assigned_by, is_primary, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, workspace_id, entity_type, entity_id, user_id, squad_id,
               assignment_role, assigned_by, assigned_at, unassigned_at,
               is_primary, metadata`,
    [
      workspaceId,
      entityType,
      entityId,
      input.user_id ?? null,
      input.squad_id ?? null,
      input.assignment_role,
      actorId,
      input.is_primary ?? false,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return result.rows[0];
}

export async function closeAssignment(
  client: PoolClient,
  workspaceId: string,
  assignmentId: string,
): Promise<boolean> {
  const result = await client.query(
    `UPDATE entity_assignments SET unassigned_at = now()
     WHERE id = $1 AND workspace_id = $2 AND unassigned_at IS NULL`,
    [assignmentId, workspaceId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listDecisionLogs(
  client: PoolClient,
  workspaceId: string,
  entityType: EntityType,
  entityId: string,
): Promise<DecisionLogRow[]> {
  const result = await client.query<DecisionLogRow>(
    `SELECT id, workspace_id, entity_type, entity_id, decision_type, title,
            rationale, impact_analysis, decided_by, created_at, deleted_at
     FROM decision_logs
     WHERE workspace_id = $1
       AND entity_type = $2
       AND entity_id = $3
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [workspaceId, entityType, entityId],
  );
  return result.rows;
}

export async function createDecisionLog(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  entityType: EntityType,
  entityId: string,
  input: CreateDecisionLogInput,
): Promise<DecisionLogRow> {
  const result = await client.query<DecisionLogRow>(
    `INSERT INTO decision_logs (
       workspace_id, entity_type, entity_id, decision_type, title,
       rationale, impact_analysis, decided_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, workspace_id, entity_type, entity_id, decision_type, title,
               rationale, impact_analysis, decided_by, created_at, deleted_at`,
    [
      workspaceId,
      entityType,
      entityId,
      input.decision_type,
      input.title,
      input.rationale,
      input.impact_analysis ?? null,
      actorId,
    ],
  );
  return result.rows[0];
}

export async function softDeleteDecisionLog(
  client: PoolClient,
  workspaceId: string,
  decisionLogId: string,
): Promise<boolean> {
  const result = await client.query(
    `UPDATE decision_logs SET deleted_at = now()
     WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
    [decisionLogId, workspaceId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listEntityEvents(
  client: PoolClient,
  workspaceId: string,
  entityType: EntityType,
  entityId: string,
): Promise<EntityEventRow[]> {
  const eventEntityTypes = [entityType, toAuditEntityType(entityType)];
  const result = await client.query<EntityEventRow>(
    `SELECT id, workspace_id, entity_type, entity_id, event_type,
            from_status, to_status, reason, changed_fields, payload,
            actor_id, actor_type, occurred_at
     FROM entity_events
     WHERE workspace_id = $1
       AND entity_type = ANY($2::text[])
       AND entity_id = $3
     ORDER BY occurred_at DESC
     LIMIT 100`,
    [workspaceId, eventEntityTypes, entityId],
  );
  return result.rows;
}

export async function listMediaAssets(
  client: PoolClient,
  workspaceId: string,
): Promise<MediaAssetRow[]> {
  const result = await client.query<MediaAssetRow>(
    `SELECT id, workspace_id, filename, mime_type, size_bytes, checksum_sha256,
            storage_provider, storage_bucket, storage_key, asset_type,
            thumbnail_key, transcript, metadata, uploaded_by,
            created_at, updated_at, deleted_at
     FROM assets
     WHERE workspace_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [workspaceId],
  );
  return result.rows;
}

export async function findMediaAssetById(
  client: PoolClient,
  workspaceId: string,
  assetId: string,
): Promise<MediaAssetRow | null> {
  const result = await client.query<MediaAssetRow>(
    `SELECT id, workspace_id, filename, mime_type, size_bytes, checksum_sha256,
            storage_provider, storage_bucket, storage_key, asset_type,
            thumbnail_key, transcript, metadata, uploaded_by,
            created_at, updated_at, deleted_at
     FROM assets
     WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
    [assetId, workspaceId],
  );
  return result.rows[0] ?? null;
}

export async function createMediaAsset(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  input: CreateMediaAssetInput,
): Promise<MediaAssetRow> {
  const result = await client.query<MediaAssetRow>(
    `INSERT INTO assets (
       workspace_id, filename, mime_type, size_bytes, checksum_sha256,
       storage_provider, storage_bucket, storage_key, asset_type,
       thumbnail_key, transcript, metadata, uploaded_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, workspace_id, filename, mime_type, size_bytes, checksum_sha256,
               storage_provider, storage_bucket, storage_key, asset_type,
               thumbnail_key, transcript, metadata, uploaded_by,
               created_at, updated_at, deleted_at`,
    [
      workspaceId,
      input.filename,
      input.mime_type,
      input.size_bytes,
      input.checksum_sha256 ?? null,
      input.storage_provider,
      input.storage_bucket,
      input.storage_key,
      input.asset_type ?? null,
      input.thumbnail_key ?? null,
      input.transcript ?? null,
      JSON.stringify(input.metadata ?? {}),
      actorId,
    ],
  );
  return result.rows[0];
}

export async function softDeleteMediaAsset(
  client: PoolClient,
  workspaceId: string,
  assetId: string,
): Promise<boolean> {
  const result = await client.query(
    `UPDATE assets SET deleted_at = now()
     WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
    [assetId, workspaceId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listAssetAttachments(
  client: PoolClient,
  workspaceId: string,
  entityType: string,
  entityId: string,
): Promise<AssetAttachmentRow[]> {
  const result = await client.query<AssetAttachmentRow>(
    `SELECT id, asset_id, attachable_type, attachable_id, workspace_id,
            role, position, attached_by, created_at
     FROM asset_attachments
     WHERE workspace_id = $1
       AND attachable_type = $2
       AND attachable_id = $3
     ORDER BY position ASC, created_at ASC`,
    [workspaceId, entityType, entityId],
  );
  return result.rows;
}

export async function attachAssetToEntity(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  entityType: string,
  entityId: string,
  input: AttachAssetInput,
): Promise<AssetAttachmentRow> {
  const result = await client.query<AssetAttachmentRow>(
    `INSERT INTO asset_attachments (
       asset_id, attachable_type, attachable_id, workspace_id,
       role, position, attached_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, asset_id, attachable_type, attachable_id, workspace_id,
               role, position, attached_by, created_at`,
    [
      input.asset_id,
      entityType,
      entityId,
      workspaceId,
      input.role ?? 'attachment',
      input.position ?? 0,
      actorId,
    ],
  );
  return result.rows[0];
}

export async function detachAsset(
  client: PoolClient,
  workspaceId: string,
  attachmentId: string,
): Promise<boolean> {
  const result = await client.query(
    `DELETE FROM asset_attachments WHERE id = $1 AND workspace_id = $2`,
    [attachmentId, workspaceId],
  );
  return (result.rowCount ?? 0) > 0;
}

function toAuditEntityType(entityType: EntityType): string {
  const irregular: Partial<Record<EntityType, string>> = {
    hypothesis: 'hypotheses',
    strategic_pillar: 'strategic_pillars',
    key_result: 'key_results',
    roadmap_item: 'roadmap_items',
    decision_log: 'decision_logs',
  };
  return irregular[entityType] ?? `${entityType}s`;
}

