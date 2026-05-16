import { PoolClient } from 'pg';
import type { UpdateEvidenceInput } from './evidences.schemas';

type EvidenceRow = {
  id: string;
  workspace_id: string;
  product_id: string | null;
  title: string;
  content: string;
  source: string;
  source_url: string | null;
  customer_identifier: string | null;
  status: string;
  collected_at: string; // ISO string from pg
  created_by: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function findEvidencesByProduct(
  client: PoolClient,
  productId: string,
) {
  const { rows } = await client.query<EvidenceRow>(
    `
    SELECT
      id, workspace_id, product_id, title, content, source, source_url,
      customer_identifier, status, collected_at, created_by, metadata,
      created_at, updated_at, deleted_at
    FROM evidences
    WHERE product_id = $1 AND deleted_at IS NULL
    ORDER BY collected_at DESC
    `,
    [productId],
  );
  return rows;
}

export async function findEvidenceById(
  client: PoolClient,
  workspaceId: string,
  id: string,
) {
  const { rows } = await client.query<EvidenceRow>(
    `
    SELECT
      id, workspace_id, product_id, title, content, source, source_url,
      customer_identifier, status, collected_at, created_by, metadata,
      created_at, updated_at, deleted_at
    FROM evidences
    WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
    `,
    [id, workspaceId],
  );
  return rows[0] ?? null;
}

export async function createEvidence(
  client: PoolClient,
  input: {
    workspace_id: string;
    actor_id: string;
    product_id: string | null;
    title: string;
    content: string;
    source: string;
    source_url: string | null;
    customer_identifier: string | null;
    status?: string;
    collected_at: string;
    metadata: unknown;
  },
) {
  const { rows } = await client.query<EvidenceRow>(
    `
    INSERT INTO evidences (
      workspace_id,
      product_id,
      title,
      content,
      source,
      source_url,
      customer_identifier,
      status,
      collected_at,
      created_by,
      metadata
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      COALESCE($8::evidence_status, 'new'::evidence_status),
      $9,$10,$11
    )
    RETURNING
      id, workspace_id, product_id, title, content, source, source_url,
      customer_identifier, status, collected_at, created_by, metadata,
      created_at, updated_at, deleted_at
    `,
    [
      input.workspace_id,
      input.product_id,
      input.title,
      input.content,
      input.source,
      input.source_url,
      input.customer_identifier,
      input.status,
      input.collected_at,
      input.actor_id,
      input.metadata,
    ],
  );

  return rows[0];
}

export async function updateEvidence(
  client: PoolClient,
  id: string,
  input: UpdateEvidenceInput,
) {
  const { rows } = await client.query<EvidenceRow>(
    `
    UPDATE evidences
    SET
      title = COALESCE($2, title),
      content = COALESCE($3, content),
      source = COALESCE($4, source),
      source_url = COALESCE($5, source_url),
      customer_identifier = COALESCE($6, customer_identifier),
      collected_at = COALESCE($7, collected_at),
      metadata = COALESCE($8, metadata)
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING
      id, workspace_id, product_id, title, content, source, source_url,
      customer_identifier, status, collected_at, created_by, metadata,
      created_at, updated_at, deleted_at
    `,
    [
      id,
      input.title ?? null,
      input.content ?? null,
      input.source ?? null,
      input.source_url ?? null,
      input.customer_identifier ?? null,
      input.collected_at ?? null,
      input.metadata ?? null,
    ],
  );

  return rows[0] ?? null;
}

export async function updateEvidenceStatus(
  client: PoolClient,
  id: string,
  status: string,
) {
  const { rows } = await client.query<EvidenceRow>(
    `
    UPDATE evidences
    SET status = $2::evidence_status
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING
      id, workspace_id, product_id, title, content, source, source_url,
      customer_identifier, status, collected_at, created_by, metadata,
      created_at, updated_at, deleted_at
    `,
    [id, status],
  );

  return rows[0] ?? null;
}

export async function softDeleteEvidence(
  client: PoolClient,
  id: string,
) {
  const { rowCount } = await client.query(
    `
    UPDATE evidences
    SET deleted_at = now()
    WHERE id = $1 AND deleted_at IS NULL
    `,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
