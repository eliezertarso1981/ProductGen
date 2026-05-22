import { PoolClient } from 'pg';
import type {
  UpdateWorkspaceMemberInput,
} from './workspace-members.schemas';

type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  job_function: string | null;
  joined_at: string;
  last_accessed_at: string | null;
  onboarded_at: string | null;
  removed_at: string | null;
  updated_at: string;
};

const MEMBER_SELECT = `
  wm.workspace_id,
  wm.user_id,
  u.name,
  u.email,
  wm.role,
  wm.job_function::text AS job_function,
  wm.joined_at,
  wm.last_accessed_at,
  wm.onboarded_at,
  wm.removed_at,
  wm.updated_at
`;

const MEMBER_FROM = `
  FROM workspace_members wm
  JOIN users u ON u.id = wm.user_id
`;

export async function listWorkspaceMembers(
  client: PoolClient,
  workspaceId: string,
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    SELECT ${MEMBER_SELECT}
    ${MEMBER_FROM}
    WHERE wm.workspace_id = $1
      AND wm.removed_at IS NULL
      AND u.deleted_at IS NULL
    ORDER BY wm.joined_at DESC
    `,
    [workspaceId],
  );

  return rows;
}

export async function getWorkspaceMember(
  client: PoolClient,
  workspaceId: string,
  userId: string,
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    SELECT ${MEMBER_SELECT}
    ${MEMBER_FROM}
    WHERE wm.workspace_id = $1
      AND wm.user_id = $2
      AND wm.removed_at IS NULL
      AND u.deleted_at IS NULL
    `,
    [workspaceId, userId],
  );

  return rows[0] ?? null;
}

export async function createWorkspaceMember(
  client: PoolClient,
  input: {
    workspace_id: string;
    actor_id: string;
    user_id: string;
    role: string;
    job_function?: string | null;
  },
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    INSERT INTO workspace_members (workspace_id, user_id, role, job_function)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET
      role = EXCLUDED.role,
      job_function = COALESCE(EXCLUDED.job_function, workspace_members.job_function),
      removed_at = NULL,
      updated_at = now()
    RETURNING
      workspace_id,
      user_id,
      (SELECT name FROM users WHERE id = workspace_members.user_id) AS name,
      (SELECT email FROM users WHERE id = workspace_members.user_id) AS email,
      role,
      job_function::text AS job_function,
      joined_at,
      last_accessed_at,
      onboarded_at,
      removed_at,
      updated_at
    `,
    [input.workspace_id, input.user_id, input.role, input.job_function ?? null],
  );

  return rows[0];
}

export async function updateWorkspaceMember(
  client: PoolClient,
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceMemberInput,
) {
  const sets: string[] = [];
  const values: unknown[] = [workspaceId, userId];
  let idx = 3;

  if (input.role !== undefined) {
    sets.push(`role = $${idx++}`);
    values.push(input.role);
  }
  if (input.job_function !== undefined) {
    sets.push(`job_function = $${idx++}`);
    values.push(input.job_function);
  }

  if (sets.length === 0) return getWorkspaceMember(client, workspaceId, userId);

  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    UPDATE workspace_members
    SET ${sets.join(', ')}, updated_at = now()
    WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL
    RETURNING
      workspace_id,
      user_id,
      (SELECT name FROM users WHERE id = workspace_members.user_id) AS name,
      (SELECT email FROM users WHERE id = workspace_members.user_id) AS email,
      role,
      job_function::text AS job_function,
      joined_at,
      last_accessed_at,
      onboarded_at,
      removed_at,
      updated_at
    `,
    values,
  );

  return rows[0] ?? null;
}

export async function softDeleteWorkspaceMember(
  client: PoolClient,
  workspaceId: string,
  userId: string,
) {
  const { rowCount } = await client.query(
    `
    UPDATE workspace_members
    SET removed_at = now()
    WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL
    `,
    [workspaceId, userId],
  );

  return (rowCount ?? 0) > 0;
}
