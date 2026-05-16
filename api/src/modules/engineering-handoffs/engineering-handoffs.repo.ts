import { PoolClient } from 'pg';
import type { CreateHandoffInput, UpdateHandoffInput } from './engineering-handoffs.schemas';

export interface EngineeringHandoff {
  id: string;
  workspace_id: string;
  roadmap_item_id: string;
  external_provider: string | null;
  external_project: string | null;
  external_ticket_id: string | null;
  external_ticket_url: string | null;
  engineering_owner: string | null;
  handoff_notes: string | null;
  approved_for_delivery: boolean;
  synced_at: Date | null;
  created_by: string | null;
  created_at: Date;
}

const SELECT_COLUMNS = `id, workspace_id, roadmap_item_id, external_provider, external_project,
  external_ticket_id, external_ticket_url, engineering_owner, handoff_notes,
  approved_for_delivery, synced_at, created_by, created_at`;

const UPDATABLE_FIELDS = [
  'external_provider',
  'external_project',
  'external_ticket_id',
  'external_ticket_url',
  'engineering_owner',
  'handoff_notes',
  'approved_for_delivery',
  'synced_at',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findRoadmapItem(
  client: PoolClient,
  roadmapItemId: string,
): Promise<{ id: string } | null> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM roadmap_items WHERE id = $1 AND deleted_at IS NULL`,
    [roadmapItemId],
  );
  return result.rows[0] ?? null;
}

export async function findHandoffsByRoadmapItem(
  client: PoolClient,
  roadmapItemId: string,
): Promise<EngineeringHandoff[]> {
  const result = await client.query<EngineeringHandoff>(
    `SELECT ${SELECT_COLUMNS}
     FROM engineering_handoffs
     WHERE roadmap_item_id = $1
     ORDER BY created_at DESC`,
    [roadmapItemId],
  );
  return result.rows;
}

export async function findHandoffById(
  client: PoolClient,
  id: string,
): Promise<EngineeringHandoff | null> {
  const result = await client.query<EngineeringHandoff>(
    `SELECT ${SELECT_COLUMNS} FROM engineering_handoffs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createHandoff(
  client: PoolClient,
  data: CreateHandoffInput & {
    workspace_id: string;
    roadmap_item_id: string;
    created_by: string;
  },
): Promise<EngineeringHandoff> {
  const result = await client.query<EngineeringHandoff>(
    `INSERT INTO engineering_handoffs (
       workspace_id, roadmap_item_id, external_provider, external_project,
       external_ticket_id, external_ticket_url, engineering_owner, handoff_notes,
       approved_for_delivery, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${SELECT_COLUMNS}`,
    [
      data.workspace_id,
      data.roadmap_item_id,
      data.external_provider ?? null,
      data.external_project ?? null,
      data.external_ticket_id ?? null,
      data.external_ticket_url ?? null,
      data.engineering_owner ?? null,
      data.handoff_notes ?? null,
      data.approved_for_delivery ?? false,
      data.created_by,
    ],
  );
  return result.rows[0];
}

export async function updateHandoff(
  client: PoolClient,
  id: string,
  data: UpdateHandoffInput,
): Promise<EngineeringHandoff | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );
  if (entries.length === 0) return findHandoffById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<EngineeringHandoff>(
    `UPDATE engineering_handoffs SET ${setClauses}
     WHERE id = $${entries.length + 1}
     RETURNING ${SELECT_COLUMNS}`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}
