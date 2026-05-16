import { PoolClient } from 'pg';
import { DeliveryType, DeliveryStatus } from './roadmap.schemas';

export interface RoadmapItem {
  id: string;
  workspace_id: string;
  product_id: string;
  parent_id: string | null;
  path: string | null; // ltree retorna como string
  type: DeliveryType;
  title: string;
  description: string | null;
  status: DeliveryStatus;
  planned_start: Date | null;
  planned_end: Date | null;
  actual_start: Date | null;
  actual_end: Date | null;
  effort_estimate: string | null;
  priority_score: number | null;
  priority_breakdown: unknown;
  external_system: string | null;
  external_id: string | null;
  external_url: string | null;
  external_status: string | null;
  external_synced_at: Date | null;
  pillar_id: string | null;
  cancel_reason: string | null;
  rollback_reason: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CreateRoadmapItemData {
  workspace_id: string;
  product_id: string;
  parent_id?: string;
  type: DeliveryType;
  title: string;
  description?: string;
  planned_start?: string;
  planned_end?: string;
  effort_estimate?: string;
  priority_score?: number;
  pillar_id?: string;
  owner_id?: string;
  external_system?: string;
  external_id?: string;
  external_url?: string;
}

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'planned_start',
  'planned_end',
  'actual_start',
  'actual_end',
  'effort_estimate',
  'priority_score',
  'pillar_id',
  'owner_id',
  'external_system',
  'external_id',
  'external_url',
  'external_status',
] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];
type UpdateRoadmapItemData = Partial<Record<UpdatableField, unknown>>;

// O driver pg retorna NUMERIC como string para preservar precisão — converte de volta para number
function normalize(row: RoadmapItem): RoadmapItem {
  return {
    ...row,
    priority_score: row.priority_score != null ? Number(row.priority_score) : null,
  };
}

export async function findRoadmapItemsByProduct(
  client: PoolClient,
  productId: string,
): Promise<RoadmapItem[]> {
  // Ordena por path: garante que pais vêm antes dos filhos na lista (ordem hierárquica natural)
  const result = await client.query<RoadmapItem>(
    `SELECT * FROM roadmap_items
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY path NULLS LAST, created_at`,
    [productId],
  );
  return result.rows.map(normalize);
}

export async function findRoadmapItemById(
  client: PoolClient,
  id: string,
): Promise<RoadmapItem | null> {
  const result = await client.query<RoadmapItem>(
    `SELECT * FROM roadmap_items WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function createRoadmapItem(
  client: PoolClient,
  data: CreateRoadmapItemData,
): Promise<RoadmapItem> {
  // Passo 1: INSERT — o banco gera o id via DEFAULT gen_random_uuid()
  const insertResult = await client.query<RoadmapItem>(
    `INSERT INTO roadmap_items
       (workspace_id, product_id, parent_id, type, title, description,
        planned_start, planned_end, effort_estimate, priority_score,
        pillar_id, owner_id, external_system, external_id, external_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      data.workspace_id,
      data.product_id,
      data.parent_id ?? null,
      data.type,
      data.title,
      data.description ?? null,
      data.planned_start ?? null,
      data.planned_end ?? null,
      data.effort_estimate ?? null,
      data.priority_score ?? null,
      data.pillar_id ?? null,
      data.owner_id ?? null,
      data.external_system ?? null,
      data.external_id ?? null,
      data.external_url ?? null,
    ],
  );
  const item = insertResult.rows[0];

  // Passo 2: calcula o path ltree (hífens do UUID viram underscores — ltree não aceita hífens)
  // e atualiza a linha recém-inserida na mesma transação
  let pathStr: string;
  if (!data.parent_id) {
    pathStr = item.id.replace(/-/g, '_');
  } else {
    const parentResult = await client.query<{ path: string }>(
      `SELECT path::text FROM roadmap_items WHERE id = $1`,
      [data.parent_id],
    );
    const parentPath = parentResult.rows[0]?.path;
    pathStr = `${parentPath}.${item.id.replace(/-/g, '_')}`;
  }

  const updateResult = await client.query<RoadmapItem>(
    `UPDATE roadmap_items SET path = $1::ltree WHERE id = $2 RETURNING *`,
    [pathStr, item.id],
  );
  return normalize(updateResult.rows[0]);
}

export async function updateRoadmapItem(
  client: PoolClient,
  id: string,
  data: UpdateRoadmapItemData,
): Promise<RoadmapItem | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findRoadmapItemById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<RoadmapItem>(
    `UPDATE roadmap_items SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING *`,
    [...values, id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function updateRoadmapItemStatus(
  client: PoolClient,
  id: string,
  status: DeliveryStatus,
  cancelReason?: string,
  rollbackReason?: string,
): Promise<RoadmapItem | null> {
  const result = await client.query<RoadmapItem>(
    `UPDATE roadmap_items
     SET status = $1,
         cancel_reason   = COALESCE($2, cancel_reason),
         rollback_reason = COALESCE($3, rollback_reason)
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [status, cancelReason ?? null, rollbackReason ?? null, id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function updateRoadmapScoring(
  client: PoolClient,
  id: string,
  method: string,
  payload: Record<string, unknown>,
  priorityScore: number | null,
): Promise<RoadmapItem | null> {
  const result = await client.query<RoadmapItem>(
    `UPDATE roadmap_items
     SET scoring_method = $1,
         scoring_payload = $2::jsonb,
         priority_score = $3,
         priority_breakdown = $2::jsonb
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [method, JSON.stringify(payload), priorityScore, id],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function softDeleteRoadmapItem(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE roadmap_items SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
