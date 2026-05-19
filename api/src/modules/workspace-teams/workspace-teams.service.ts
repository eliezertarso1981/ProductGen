import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type {
  CreateWorkspaceTeamInput,
  UpdateWorkspaceTeamInput,
} from './workspace-teams.schemas';
import * as repo from './workspace-teams.repo';

export async function listTeams(workspaceId: string, actorId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findTeamsByWorkspace(client, workspaceId),
  );
}

export async function getTeam(workspaceId: string, actorId: string, id: string) {
  const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findTeamById(client, id),
  );
  if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
  return team;
}

export async function createTeam(
  workspaceId: string,
  actorId: string,
  input: CreateWorkspaceTeamInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createTeam(client, { ...input, workspace_id: workspaceId }),
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateTeam(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateWorkspaceTeamInput,
) {
  try {
    const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateTeam(client, id, input),
    );
    if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
    return team;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteTeam(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteTeam(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
}

export async function addMember(workspaceId: string, actorId: string, teamId: string, userId: string) {
  try {
    const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.addTeamMember(client, teamId, userId),
    );
    if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
    return team;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function removeMember(workspaceId: string, actorId: string, teamId: string, userId: string) {
  const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.removeTeamMember(client, teamId, userId),
  );
  if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
  return team;
}

export async function addProduct(
  workspaceId: string,
  actorId: string,
  teamId: string,
  productId: string,
) {
  try {
    const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.addTeamProduct(client, teamId, productId),
    );
    if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
    return team;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function removeProduct(
  workspaceId: string,
  actorId: string,
  teamId: string,
  productId: string,
) {
  const team = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.removeTeamProduct(client, teamId, productId),
  );
  if (!team) throw new AppError(404, 'NOT_FOUND', 'Time não encontrado');
  return team;
}
