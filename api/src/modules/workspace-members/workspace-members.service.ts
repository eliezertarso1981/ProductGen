import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError } from '../../shared/errors';
import type {
  CreateWorkspaceMemberInput,
  UpdateWorkspaceMemberInput,
} from './workspace-members.schemas';
import * as repo from './workspace-members.repo';

export async function listMembers(workspaceId: string, actorId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.listWorkspaceMembers(client, workspaceId),
  );
}

export async function getMember(
  workspaceId: string,
  actorId: string,
  userId: string,
) {
  const member = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.getWorkspaceMember(client, workspaceId, userId),
  );

  if (!member) throw new AppError(404, 'NOT_FOUND', 'Membro não encontrado');
  return member;
}

export async function createMember(
  workspaceId: string,
  actorId: string,
  input: CreateWorkspaceMemberInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createWorkspaceMember(client, {
        workspace_id: workspaceId,
        actor_id: actorId,
        user_id: input.user_id,
        role: input.role,
        job_function: input.job_function ?? null,
      }),
    );
  } catch (err) {
    // reutiliza mapeamento padrão do projeto quando disponível
    // (workspace_members ainda não tem testes de erro; mapeamento será adicionado se necessário)
    if (err instanceof AppError) throw err;
    throw err;
  }
}

export async function updateMemberRole(
  workspaceId: string,
  actorId: string,
  userId: string,
  input: UpdateWorkspaceMemberInput,
) {
  const member = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.updateWorkspaceMember(client, workspaceId, userId, input),
  );

  if (!member) throw new AppError(404, 'NOT_FOUND', 'Membro não encontrado');
  return member;
}

export async function deleteMember(
  workspaceId: string,
  actorId: string,
  userId: string,
) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteWorkspaceMember(client, workspaceId, userId),
  );

  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Membro não encontrado');
}
