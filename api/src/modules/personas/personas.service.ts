import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type { CreatePersonaInput, UpdatePersonaInput } from './personas.schemas';
import * as repo from './personas.repo';

export async function listPersonas(workspaceId: string, actorId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPersonasByWorkspace(client, workspaceId),
  );
}

export async function getPersona(workspaceId: string, actorId: string, id: string) {
  const persona = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findPersonaById(client, id),
  );
  if (!persona) throw new AppError(404, 'NOT_FOUND', 'Persona não encontrada');
  return persona;
}

export async function createPersona(
  workspaceId: string,
  actorId: string,
  input: CreatePersonaInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createPersona(client, { ...input, workspace_id: workspaceId }),
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updatePersona(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdatePersonaInput,
) {
  try {
    const persona = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updatePersona(client, id, input),
    );
    if (!persona) throw new AppError(404, 'NOT_FOUND', 'Persona não encontrada');
    return persona;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deletePersona(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeletePersona(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Persona não encontrada');
}

export async function listPainPersonas(workspaceId: string, actorId: string, painId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    if (!(await repo.painExists(client, painId))) {
      throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    }
    return repo.findPersonasForPain(client, painId);
  });
}

export async function linkPainPersona(
  workspaceId: string,
  actorId: string,
  painId: string,
  personaId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      if (!(await repo.painExists(client, painId))) {
        throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
      }
      const persona = await repo.findPersonaById(client, personaId);
      if (!persona) throw new AppError(404, 'NOT_FOUND', 'Persona não encontrada');
      await repo.linkPainPersona(client, workspaceId, painId, personaId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkPainPersona(
  workspaceId: string,
  actorId: string,
  painId: string,
  personaId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkPainPersona(client, painId, personaId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}
