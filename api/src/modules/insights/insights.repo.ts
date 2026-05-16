import { PoolClient } from 'pg';
import type { CreateInsightInput, UpdateInsightInput } from './insights.schemas';

export interface Insight {
  id: string;
  workspace_id: string;
  product_id: string | null;
  title: string;
  description: string;
  confidence_score: number | null;
  impact_score: number | null;
  frequency_score: number | null;
  evidence_count: number;
  owner_id: string | null;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'confidence_score',
  'impact_score',
  'frequency_score',
  'owner_id',
  'metadata',
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findInsightsByProduct(
  client: PoolClient,
  productId: string,
): Promise<Insight[]> {
  const result = await client.query<Insight>(
    `SELECT id, workspace_id, product_id, title, description,
            confidence_score, impact_score, frequency_score, evidence_count,
            owner_id, metadata, created_at, updated_at, deleted_at
     FROM insights
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [productId],
  );
  return result.rows;
}

export async function findInsightById(client: PoolClient, id: string): Promise<Insight | null> {
  const result = await client.query<Insight>(
    `SELECT id, workspace_id, product_id, title, description,
            confidence_score, impact_score, frequency_score, evidence_count,
            owner_id, metadata, created_at, updated_at, deleted_at
     FROM insights WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createInsight(
  client: PoolClient,
  data: CreateInsightInput & { workspace_id: string; product_id: string },
): Promise<Insight> {
  const result = await client.query<Insight>(
    `INSERT INTO insights (
       workspace_id, product_id, title, description,
       confidence_score, impact_score, frequency_score, owner_id, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, workspace_id, product_id, title, description,
               confidence_score, impact_score, frequency_score, evidence_count,
               owner_id, metadata, created_at, updated_at, deleted_at`,
    [
      data.workspace_id,
      data.product_id,
      data.title,
      data.description,
      data.confidence_score ?? null,
      data.impact_score ?? null,
      data.frequency_score ?? null,
      data.owner_id ?? null,
      JSON.stringify(data.metadata ?? {}),
    ],
  );
  return result.rows[0];
}

export async function updateInsight(
  client: PoolClient,
  id: string,
  data: UpdateInsightInput,
): Promise<Insight | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findInsightById(client, id);

  const setClauses = entries
    .map(([key], i) => (key === 'metadata' ? `${key} = $${i + 1}::jsonb` : `${key} = $${i + 1}`))
    .join(', ');

  const values = entries.map(([key, v]) => (key === 'metadata' ? JSON.stringify(v) : v));

  const result = await client.query<Insight>(
    `UPDATE insights SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING id, workspace_id, product_id, title, description,
               confidence_score, impact_score, frequency_score, evidence_count,
               owner_id, metadata, created_at, updated_at, deleted_at`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeleteInsight(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE insights SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function linkEvidence(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  insightId: string,
  evidenceId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO evidence_insight_links (evidence_id, insight_id, workspace_id, created_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [evidenceId, insightId, workspaceId, actorId],
  );

  await client.query(
    `UPDATE insights
     SET evidence_count = (
       SELECT count(*)::int FROM evidence_insight_links WHERE insight_id = $1
     )
     WHERE id = $1`,
    [insightId],
  );
}

export async function unlinkEvidence(
  client: PoolClient,
  insightId: string,
  evidenceId: string,
): Promise<boolean> {
  const result = await client.query(
    `DELETE FROM evidence_insight_links
     WHERE insight_id = $1 AND evidence_id = $2`,
    [insightId, evidenceId],
  );

  if ((result.rowCount ?? 0) > 0) {
    await client.query(
      `UPDATE insights
       SET evidence_count = (
         SELECT count(*)::int FROM evidence_insight_links WHERE insight_id = $1
       )
       WHERE id = $1`,
      [insightId],
    );
    return true;
  }
  return false;
}

export async function listLinkedEvidences(client: PoolClient, insightId: string) {
  const result = await client.query(
    `SELECT e.id, e.title, e.source, e.status, e.collected_at, l.created_at AS linked_at
     FROM evidence_insight_links l
     JOIN evidences e ON e.id = l.evidence_id AND e.deleted_at IS NULL
     WHERE l.insight_id = $1
     ORDER BY l.created_at DESC`,
    [insightId],
  );
  return result.rows;
}
