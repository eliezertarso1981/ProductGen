import { PoolClient } from 'pg';
import type { CreatePersonaInput, UpdatePersonaInput } from './personas.schemas';

export interface Persona {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  description: string | null;
  segment_size_estimate: number | null;
  metadata: Record<string, unknown>;
  pain_ids: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `
  p.id,
  p.workspace_id,
  p.code,
  p.name,
  p.description,
  p.segment_size_estimate,
  p.metadata,
  COALESCE(pain_links.pain_ids, ARRAY[]::uuid[]) AS pain_ids,
  p.created_at,
  p.updated_at,
  p.deleted_at
`;

const PERSONA_WITH_LINKS_FROM = `
  FROM personas p
  LEFT JOIN LATERAL (
    SELECT array_agg(l.pain_id ORDER BY l.created_at ASC) AS pain_ids
    FROM pain_persona_links l
    JOIN pains pain ON pain.id = l.pain_id AND pain.deleted_at IS NULL
    WHERE l.workspace_id = p.workspace_id
      AND l.persona_id = p.id
  ) pain_links ON true
`;

const UPDATABLE_FIELDS = ['name', 'description', 'segment_size_estimate', 'metadata'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findPersonasByWorkspace(
  client: PoolClient,
  workspaceId: string,
): Promise<Persona[]> {
  const result = await client.query<Persona>(
    `SELECT ${SELECT_COLUMNS}
     ${PERSONA_WITH_LINKS_FROM}
     WHERE p.workspace_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC`,
    [workspaceId],
  );
  return result.rows;
}

export async function findPersonasForPain(client: PoolClient, painId: string): Promise<Persona[]> {
  const result = await client.query<Persona>(
    `SELECT ${SELECT_COLUMNS}
     ${PERSONA_WITH_LINKS_FROM}
     JOIN pain_persona_links selected_link
       ON selected_link.persona_id = p.id
      AND selected_link.pain_id = $1
     WHERE p.deleted_at IS NULL
     ORDER BY selected_link.created_at DESC`,
    [painId],
  );
  return result.rows;
}

export async function findPersonaById(client: PoolClient, id: string): Promise<Persona | null> {
  const result = await client.query<Persona>(
    `SELECT ${SELECT_COLUMNS}
     ${PERSONA_WITH_LINKS_FROM}
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createPersona(
  client: PoolClient,
  data: CreatePersonaInput & { workspace_id: string },
): Promise<Persona> {
  const code = await nextPersonaCode(client, data.workspace_id);
  const result = await client.query<{ id: string }>(
    `INSERT INTO personas (workspace_id, code, name, description, segment_size_estimate, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id`,
    [
      data.workspace_id,
      code,
      data.name,
      data.description ?? null,
      data.segment_size_estimate ?? null,
      JSON.stringify(data.metadata ?? {}),
    ],
  );

  return findPersonaById(client, result.rows[0].id) as Promise<Persona>;
}

export async function updatePersona(
  client: PoolClient,
  id: string,
  data: UpdatePersonaInput,
): Promise<Persona | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length > 0) {
    const setClauses = entries
      .map(([key], i) => (key === 'metadata' ? `${key} = $${i + 1}::jsonb` : `${key} = $${i + 1}`))
      .join(', ');
    const values = entries.map(([key, value]) =>
      key === 'metadata' ? JSON.stringify(value ?? {}) : value,
    );

    await client.query(
      `UPDATE personas
       SET ${setClauses}
       WHERE id = $${entries.length + 1} AND deleted_at IS NULL`,
      [...values, id],
    );
  }

  return findPersonaById(client, id);
}

export async function softDeletePersona(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE personas SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function linkPainPersona(
  client: PoolClient,
  workspaceId: string,
  painId: string,
  personaId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO pain_persona_links (workspace_id, pain_id, persona_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [workspaceId, painId, personaId],
  );
}

export async function unlinkPainPersona(
  client: PoolClient,
  painId: string,
  personaId: string,
): Promise<boolean> {
  const result = await client.query(
    `DELETE FROM pain_persona_links WHERE pain_id = $1 AND persona_id = $2`,
    [painId, personaId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function painExists(client: PoolClient, painId: string): Promise<boolean> {
  const result = await client.query(
    `SELECT 1 FROM pains WHERE id = $1 AND deleted_at IS NULL`,
    [painId],
  );
  return (result.rowCount ?? 0) > 0;
}

async function nextPersonaCode(client: PoolClient, workspaceId: string): Promise<string> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
    `personas:${workspaceId}:code`,
  ]);
  const result = await client.query<{ code: string }>(
    `SELECT code FROM personas
     WHERE workspace_id = $1 AND code ~ '^PS-[0-9]+$'
     ORDER BY (substring(code from 4))::int DESC
     LIMIT 1`,
    [workspaceId],
  );
  const last = result.rows[0]?.code;
  const next = last ? Number.parseInt(last.slice(3), 10) + 1 : 1;
  return `PS-${String(next).padStart(2, '0')}`;
}
