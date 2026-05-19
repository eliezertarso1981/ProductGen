import { PoolClient } from 'pg';
import type {
  CreateWorkspaceTeamInput,
  UpdateWorkspaceTeamInput,
} from './workspace-teams.schemas';

export interface WorkspaceTeam {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  member_ids: string[];
  product_ids: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

const SELECT_COLUMNS = `
  wt.id,
  wt.workspace_id,
  wt.code,
  wt.name,
  wt.description,
  wt.color,
  COALESCE(member_links.member_ids, ARRAY[]::uuid[]) AS member_ids,
  COALESCE(product_links.product_ids, ARRAY[]::uuid[]) AS product_ids,
  wt.created_at,
  wt.updated_at,
  wt.deleted_at
`;

const TEAM_WITH_LINKS_FROM = `
  FROM workspace_teams wt
  LEFT JOIN LATERAL (
    SELECT array_agg(wtm.user_id ORDER BY wtm.added_at ASC) AS member_ids
    FROM workspace_team_members wtm
    JOIN workspace_members wm
      ON wm.workspace_id = wtm.workspace_id
     AND wm.user_id = wtm.user_id
     AND wm.removed_at IS NULL
    WHERE wtm.workspace_id = wt.workspace_id
      AND wtm.team_id = wt.id
  ) member_links ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(wtp.product_id ORDER BY wtp.added_at ASC) AS product_ids
    FROM workspace_team_products wtp
    JOIN products p
      ON p.workspace_id = wtp.workspace_id
     AND p.id = wtp.product_id
     AND p.deleted_at IS NULL
    WHERE wtp.workspace_id = wt.workspace_id
      AND wtp.team_id = wt.id
  ) product_links ON true
`;

const UPDATABLE_FIELDS = ['name', 'description', 'color'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export async function findTeamsByWorkspace(
  client: PoolClient,
  workspaceId: string,
): Promise<WorkspaceTeam[]> {
  const result = await client.query<WorkspaceTeam>(
    `SELECT ${SELECT_COLUMNS}
     ${TEAM_WITH_LINKS_FROM}
     WHERE wt.workspace_id = $1 AND wt.deleted_at IS NULL
     ORDER BY wt.created_at DESC`,
    [workspaceId],
  );
  return result.rows;
}

export async function findTeamById(client: PoolClient, id: string): Promise<WorkspaceTeam | null> {
  const result = await client.query<WorkspaceTeam>(
    `SELECT ${SELECT_COLUMNS}
     ${TEAM_WITH_LINKS_FROM}
     WHERE wt.id = $1 AND wt.deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createTeam(
  client: PoolClient,
  data: CreateWorkspaceTeamInput & { workspace_id: string },
): Promise<WorkspaceTeam> {
  const code = await nextTeamCode(client, data.workspace_id);
  const result = await client.query<{ id: string }>(
    `INSERT INTO workspace_teams (workspace_id, code, name, description, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      data.workspace_id,
      code,
      data.name,
      data.description ?? null,
      data.color ?? null,
    ],
  );

  const teamId = result.rows[0].id;
  await syncTeamMembers(client, data.workspace_id, teamId, data.member_ids);
  await syncTeamProducts(client, data.workspace_id, teamId, data.product_ids);

  return findTeamById(client, teamId) as Promise<WorkspaceTeam>;
}

export async function updateTeam(
  client: PoolClient,
  id: string,
  data: UpdateWorkspaceTeamInput,
): Promise<WorkspaceTeam | null> {
  const entries = (Object.entries(data) as [UpdatableField, unknown][]).filter(
    ([key, value]) => UPDATABLE_FIELDS.includes(key) && value !== undefined,
  );

  if (entries.length > 0) {
    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    await client.query(
      `UPDATE workspace_teams
       SET ${setClauses}
       WHERE id = $${entries.length + 1} AND deleted_at IS NULL`,
      [...values, id],
    );
  }

  return findTeamById(client, id);
}

export async function softDeleteTeam(client: PoolClient, id: string): Promise<boolean> {
  const result = await client.query(
    `UPDATE workspace_teams SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function addTeamMember(
  client: PoolClient,
  teamId: string,
  userId: string,
): Promise<WorkspaceTeam | null> {
  const team = await findTeamById(client, teamId);
  if (!team) return null;

  await client.query(
    `INSERT INTO workspace_team_members (workspace_id, team_id, user_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, user_id) DO NOTHING`,
    [team.workspace_id, teamId, userId],
  );
  return findTeamById(client, teamId);
}

export async function removeTeamMember(
  client: PoolClient,
  teamId: string,
  userId: string,
): Promise<WorkspaceTeam | null> {
  const team = await findTeamById(client, teamId);
  if (!team) return null;

  await client.query(
    `DELETE FROM workspace_team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId],
  );
  return findTeamById(client, teamId);
}

export async function addTeamProduct(
  client: PoolClient,
  teamId: string,
  productId: string,
): Promise<WorkspaceTeam | null> {
  const team = await findTeamById(client, teamId);
  if (!team) return null;

  await client.query(
    `INSERT INTO workspace_team_products (workspace_id, team_id, product_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, product_id) DO NOTHING`,
    [team.workspace_id, teamId, productId],
  );
  return findTeamById(client, teamId);
}

export async function removeTeamProduct(
  client: PoolClient,
  teamId: string,
  productId: string,
): Promise<WorkspaceTeam | null> {
  const team = await findTeamById(client, teamId);
  if (!team) return null;

  await client.query(
    `DELETE FROM workspace_team_products WHERE team_id = $1 AND product_id = $2`,
    [teamId, productId],
  );
  return findTeamById(client, teamId);
}

async function syncTeamMembers(
  client: PoolClient,
  workspaceId: string,
  teamId: string,
  memberIds: string[],
) {
  for (const memberId of memberIds) {
    await client.query(
      `INSERT INTO workspace_team_members (workspace_id, team_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [workspaceId, teamId, memberId],
    );
  }
}

async function syncTeamProducts(
  client: PoolClient,
  workspaceId: string,
  teamId: string,
  productIds: string[],
) {
  for (const productId of productIds) {
    await client.query(
      `INSERT INTO workspace_team_products (workspace_id, team_id, product_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, product_id) DO NOTHING`,
      [workspaceId, teamId, productId],
    );
  }
}

async function nextTeamCode(client: PoolClient, workspaceId: string): Promise<string> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
    `workspace-teams:${workspaceId}:code`,
  ]);
  const result = await client.query<{ code: string }>(
    `SELECT code FROM workspace_teams
     WHERE workspace_id = $1 AND code ~ '^TM-[0-9]+$'
     ORDER BY (substring(code from 4))::int DESC
     LIMIT 1`,
    [workspaceId],
  );
  const last = result.rows[0]?.code;
  const next = last ? Number.parseInt(last.slice(3), 10) + 1 : 1;
  return `TM-${String(next).padStart(2, '0')}`;
}
