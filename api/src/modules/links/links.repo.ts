import { PoolClient } from 'pg';

export async function linkPainHypothesis(
  client: PoolClient,
  workspaceId: string,
  painId: string,
  hypothesisId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO pain_hypothesis_links (pain_id, hypothesis_id, workspace_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [painId, hypothesisId, workspaceId],
  );
}

export async function unlinkPainHypothesis(
  client: PoolClient,
  painId: string,
  hypothesisId: string,
): Promise<boolean> {
  const result = await client.query(
    `DELETE FROM pain_hypothesis_links WHERE pain_id = $1 AND hypothesis_id = $2`,
    [painId, hypothesisId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listHypothesesForPain(client: PoolClient, painId: string) {
  const result = await client.query(
    `SELECT h.id, h.title, h.status, l.created_at AS linked_at
     FROM pain_hypothesis_links l
     JOIN hypotheses h ON h.id = l.hypothesis_id AND h.deleted_at IS NULL
     WHERE l.pain_id = $1
     ORDER BY l.created_at DESC`,
    [painId],
  );
  return result.rows;
}

export async function linkHypothesisRoadmap(
  client: PoolClient,
  workspaceId: string,
  hypothesisId: string,
  roadmapItemId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO hypothesis_roadmap_links (hypothesis_id, roadmap_item_id, workspace_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [hypothesisId, roadmapItemId, workspaceId],
  );
}

export async function unlinkHypothesisRoadmap(
  client: PoolClient,
  hypothesisId: string,
  roadmapItemId: string,
): Promise<boolean> {
  const result = await client.query(
    `DELETE FROM hypothesis_roadmap_links
     WHERE hypothesis_id = $1 AND roadmap_item_id = $2`,
    [hypothesisId, roadmapItemId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listRoadmapForHypothesis(client: PoolClient, hypothesisId: string) {
  const result = await client.query(
    `SELECT r.id, r.title, r.type, r.status, l.created_at AS linked_at
     FROM hypothesis_roadmap_links l
     JOIN roadmap_items r ON r.id = l.roadmap_item_id AND r.deleted_at IS NULL
     WHERE l.hypothesis_id = $1
     ORDER BY l.created_at DESC`,
    [hypothesisId],
  );
  return result.rows;
}

export async function painExists(client: PoolClient, painId: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM pains WHERE id = $1 AND deleted_at IS NULL`,
    [painId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function hypothesisExists(client: PoolClient, hypothesisId: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM hypotheses WHERE id = $1 AND deleted_at IS NULL`,
    [hypothesisId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function roadmapItemExists(client: PoolClient, roadmapItemId: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM roadmap_items WHERE id = $1 AND deleted_at IS NULL`,
    [roadmapItemId],
  );
  return (result.rowCount ?? 0) > 0;
}
