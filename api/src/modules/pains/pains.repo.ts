import { PoolClient } from 'pg';
import { PainStatus } from './pains.schemas';

export interface Pain {
  id: string;
  workspace_id: string;
  product_id: string;
  parent_pain_id: string | null;
  root_pain_id: string | null;
  title: string;
  description: string | null;
  status: PainStatus;
  severity: number | null;
  reach_estimate: number | null;
  priority_score: number | null;
  scoring_method: string | null;
  scoring_payload: unknown;
  discard_reason: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface PainRelationship {
  id: string;
  workspace_id: string;
  source_pain_id: string;
  target_pain_id: string;
  relationship_type: string;
  reason: string | null;
  created_by: string | null;
  created_at: Date;
}

interface CreatePainData {
  workspace_id: string;
  product_id: string;
  title: string;
  description?: string;
  severity?: number;
  reach_estimate?: number;
  owner_id?: string;
}

// Campos permitidos no UPDATE — lista explícita evita que nomes vindos de fora
// entrem na query como coluna (defesa extra além da validação Zod)
const UPDATABLE_FIELDS = ['title', 'description', 'severity', 'reach_estimate', 'owner_id'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];
type UpdatePainData = Partial<Record<UpdatableField, string | number | null>>;

export async function findPainsByProduct(client: PoolClient, productId: string): Promise<Pain[]> {
  const result = await client.query<Pain>(
    `SELECT * FROM pains
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY severity DESC NULLS LAST, created_at DESC`,
    [productId],
  );
  return result.rows;
}

export async function findPainById(client: PoolClient, id: string): Promise<Pain | null> {
  const result = await client.query<Pain>(
    `SELECT * FROM pains WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createPain(client: PoolClient, data: CreatePainData): Promise<Pain> {
  const result = await client.query<Pain>(
    `INSERT INTO pains (workspace_id, product_id, title, description, severity, reach_estimate, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.workspace_id,
      data.product_id,
      data.title,
      data.description ?? null,
      data.severity ?? null,
      data.reach_estimate ?? null,
      data.owner_id ?? null,
    ],
  );
  return result.rows[0];
}

export async function updatePain(
  client: PoolClient,
  id: string,
  data: UpdatePainData,
): Promise<Pain | null> {
  // Filtra apenas campos presentes (undefined = não enviar; null = limpar)
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length === 0) return findPainById(client, id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);

  const result = await client.query<Pain>(
    `UPDATE pains SET ${setClauses}
     WHERE id = $${entries.length + 1} AND deleted_at IS NULL
     RETURNING *`,
    [...values, id],
  );
  return result.rows[0] ?? null;
}

export async function updatePainStatus(
  client: PoolClient,
  id: string,
  status: PainStatus,
  discardReason?: string,
): Promise<Pain | null> {
  // COALESCE preserva o discard_reason já existente se não for enviado um novo
  const result = await client.query<Pain>(
    `UPDATE pains
     SET status = $1, discard_reason = COALESCE($2, discard_reason)
     WHERE id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [status, discardReason ?? null, id],
  );
  return result.rows[0] ?? null;
}

export async function softDeletePain(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE pains SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updatePainScoring(
  client: PoolClient,
  id: string,
  method: string,
  payload: Record<string, unknown>,
  priorityScore: number | null,
): Promise<Pain | null> {
  const result = await client.query<Pain>(
    `UPDATE pains
     SET scoring_method = $1,
         scoring_payload = $2::jsonb,
         priority_score = $3
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [method, JSON.stringify(payload), priorityScore, id],
  );
  return result.rows[0] ?? null;
}

export async function listPainRelationships(
  client: PoolClient,
  painId: string,
): Promise<PainRelationship[]> {
  const result = await client.query<PainRelationship>(
    `SELECT id, workspace_id, source_pain_id, target_pain_id, relationship_type,
            reason, created_by, created_at
     FROM pain_relationships
     WHERE source_pain_id = $1 OR target_pain_id = $1
     ORDER BY created_at DESC`,
    [painId],
  );
  return result.rows;
}

export async function mergePains(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  targetPainId: string,
  sourcePainIds: string[],
  reason?: string,
): Promise<Pain> {
  for (const sourceId of sourcePainIds) {
    if (sourceId === targetPainId) continue;

    await client.query(
      `INSERT INTO pain_relationships (
         workspace_id, source_pain_id, target_pain_id, relationship_type, reason, created_by
       ) VALUES ($1, $2, $3, 'merged_from', $4, $5)`,
      [workspaceId, sourceId, targetPainId, reason ?? null, actorId],
    );

    await client.query(
      `UPDATE pains SET status = 'merged', deleted_at = now()
       WHERE id = $1 AND deleted_at IS NULL`,
      [sourceId],
    );

    await client.query(
      `INSERT INTO pain_hypothesis_links (pain_id, hypothesis_id)
       SELECT $1, hypothesis_id FROM pain_hypothesis_links WHERE pain_id = $2
       ON CONFLICT DO NOTHING`,
      [targetPainId, sourceId],
    );
  }

  const target = await findPainById(client, targetPainId);
  if (!target) throw new Error('Target pain missing after merge');
  return target;
}

export async function splitPain(
  client: PoolClient,
  workspaceId: string,
  actorId: string,
  parentPain: Pain,
  children: Array<{ title: string; description?: string }>,
  reason?: string,
): Promise<Pain[]> {
  const rootId = parentPain.root_pain_id ?? parentPain.id;
  const created: Pain[] = [];

  for (const child of children) {
    const result = await client.query<Pain>(
      `INSERT INTO pains (
         workspace_id, product_id, parent_pain_id, root_pain_id,
         title, description, severity, reach_estimate, owner_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        workspaceId,
        parentPain.product_id,
        parentPain.id,
        rootId,
        child.title,
        child.description ?? null,
        parentPain.severity,
        parentPain.reach_estimate,
        parentPain.owner_id,
      ],
    );
    const childPain = result.rows[0];

    await client.query(
      `INSERT INTO pain_relationships (
         workspace_id, source_pain_id, target_pain_id, relationship_type, reason, created_by
       ) VALUES ($1, $2, $3, 'split_from', $4, $5)`,
      [workspaceId, parentPain.id, childPain.id, reason ?? null, actorId],
    );

    await client.query(
      `INSERT INTO pain_hypothesis_links (pain_id, hypothesis_id)
       SELECT $1, hypothesis_id FROM pain_hypothesis_links WHERE pain_id = $2
       ON CONFLICT DO NOTHING`,
      [childPain.id, parentPain.id],
    );

    created.push(childPain);
  }

  await client.query(
    `UPDATE pains SET status = 'split' WHERE id = $1 AND deleted_at IS NULL`,
    [parentPain.id],
  );

  return created;
}
