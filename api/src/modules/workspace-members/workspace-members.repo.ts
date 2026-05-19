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
  joined_at: string;
  last_accessed_at: string | null;
  onboarded_at: string | null;
  removed_at: string | null;
  updated_at: string;
};

export async function listWorkspaceMembers(
  client: PoolClient,
  workspaceId: string,
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    SELECT
      wm.workspace_id,
      wm.user_id,
      u.name,
      u.email,
      wm.role,
      wm.joined_at,
      wm.last_accessed_at,
      wm.onboarded_at,
      wm.removed_at,
      wm.updated_at
    FROM workspace_members wm
    JOIN users u ON u.id = wm.user_id
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
    SELECT
      wm.workspace_id,
      wm.user_id,
      u.name,
      u.email,
      wm.role,
      wm.joined_at,
      wm.last_accessed_at,
      wm.onboarded_at,
      wm.removed_at,
      wm.updated_at
    FROM workspace_members wm
    JOIN users u ON u.id = wm.user_id
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
  },
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET
      role = EXCLUDED.role,
      removed_at = NULL,
      updated_at = now()
    RETURNING
      workspace_id,
      user_id,
      (SELECT name FROM users WHERE id = workspace_members.user_id) AS name,
      (SELECT email FROM users WHERE id = workspace_members.user_id) AS email,
      role,
      joined_at,
      last_accessed_at,
      onboarded_at,
      removed_at,
      updated_at
    `,
    [input.workspace_id, input.user_id, input.role],
  );

  return rows[0];
}

export async function updateWorkspaceMemberRole(
  client: PoolClient,
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceMemberInput,
) {
  const { rows } = await client.query<WorkspaceMemberRow>(
    `
    UPDATE workspace_members
    SET role = $3
    WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL
    RETURNING
      workspace_id,
      user_id,
      (SELECT name FROM users WHERE id = workspace_members.user_id) AS name,
      (SELECT email FROM users WHERE id = workspace_members.user_id) AS email,
      role,
      joined_at,
      last_accessed_at,
      onboarded_at,
      removed_at,
      updated_at
    `,
    [workspaceId, userId, input.role],
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
