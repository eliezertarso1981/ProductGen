import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import type {
  CreateExperimentInput,
  UpdateExperimentInput,
  UpdateExperimentStatusInput,
} from './experiments.schemas';
import * as repo from './experiments.repo';

export async function listExperimentsByHypothesis(
  workspaceId: string,
  actorId: string,
  hypothesisId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    const hypothesis = await repo.findHypothesisWorkspace(client, hypothesisId);
    if (!hypothesis) {
      throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
    }
    return repo.findExperimentsByHypothesis(client, hypothesisId);
  });
}

export async function getExperiment(workspaceId: string, actorId: string, id: string) {
  const experiment = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findExperimentById(client, id),
  );
  if (!experiment) throw new AppError(404, 'NOT_FOUND', 'Experimento não encontrado');
  return experiment;
}

export async function createExperiment(
  workspaceId: string,
  actorId: string,
  hypothesisId: string,
  input: CreateExperimentInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const hypothesis = await repo.findHypothesisWorkspace(client, hypothesisId);
      if (!hypothesis) {
        throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
      }

      return repo.createExperiment(client, {
        workspace_id: workspaceId,
        hypothesis_id: hypothesisId,
        title: input.title,
        method: input.method,
        success_criteria: input.success_criteria,
        sample_target: input.sample_target,
        owner_id: input.owner_id,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateExperiment(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateExperimentInput,
) {
  try {
    const experiment = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateExperiment(client, id, input),
    );
    if (!experiment) throw new AppError(404, 'NOT_FOUND', 'Experimento não encontrado');
    return experiment;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionExperimentStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateExperimentStatusInput,
) {
  try {
    const experiment = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateExperimentStatus(
        client,
        id,
        input.status,
        input.result,
        input.learnings,
      ),
    );
    if (!experiment) throw new AppError(404, 'NOT_FOUND', 'Experimento não encontrado');
    return experiment;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function deleteExperiment(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteExperiment(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Experimento não encontrado');
}
