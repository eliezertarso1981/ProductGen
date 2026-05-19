import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import * as repo from './links.repo';

export async function listPainHypotheses(
  workspaceId: string,
  actorId: string,
  painId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    if (!(await repo.painExists(client, painId))) {
      throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    }
    return repo.listHypothesesForPain(client, painId);
  });
}

export async function linkPainHypothesis(
  workspaceId: string,
  actorId: string,
  painId: string,
  hypothesisId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      if (!(await repo.painExists(client, painId))) {
        throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
      }
      if (!(await repo.hypothesisExists(client, hypothesisId))) {
        throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
      }
      await repo.linkPainHypothesis(client, workspaceId, painId, hypothesisId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkPainHypothesis(
  workspaceId: string,
  actorId: string,
  painId: string,
  hypothesisId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkPainHypothesis(client, painId, hypothesisId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}

export async function listPainStrategicPillars(
  workspaceId: string,
  actorId: string,
  painId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    if (!(await repo.painExists(client, painId))) {
      throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    }
    return repo.listStrategicPillarsForPain(client, painId);
  });
}

export async function linkPainStrategicPillar(
  workspaceId: string,
  actorId: string,
  painId: string,
  pillarId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      if (!(await repo.painExists(client, painId))) {
        throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
      }
      if (!(await repo.strategicPillarExists(client, pillarId))) {
        throw new AppError(404, 'NOT_FOUND', 'Pilar estratégico não encontrado');
      }
      await repo.linkPainStrategicPillar(client, workspaceId, painId, pillarId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkPainStrategicPillar(
  workspaceId: string,
  actorId: string,
  painId: string,
  pillarId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkPainStrategicPillar(client, painId, pillarId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}

export async function listPainObjectives(
  workspaceId: string,
  actorId: string,
  painId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    if (!(await repo.painExists(client, painId))) {
      throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
    }
    return repo.listObjectivesForPain(client, painId);
  });
}

export async function linkPainObjective(
  workspaceId: string,
  actorId: string,
  painId: string,
  objectiveId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      if (!(await repo.painExists(client, painId))) {
        throw new AppError(404, 'NOT_FOUND', 'Dor não encontrada');
      }
      if (!(await repo.objectiveExists(client, objectiveId))) {
        throw new AppError(404, 'NOT_FOUND', 'Objetivo não encontrado');
      }
      await repo.linkPainObjective(client, workspaceId, painId, objectiveId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkPainObjective(
  workspaceId: string,
  actorId: string,
  painId: string,
  objectiveId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkPainObjective(client, painId, objectiveId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}

export async function listHypothesisRoadmap(
  workspaceId: string,
  actorId: string,
  hypothesisId: string,
) {
  return withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
    if (!(await repo.hypothesisExists(client, hypothesisId))) {
      throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
    }
    return repo.listRoadmapForHypothesis(client, hypothesisId);
  });
}

export async function linkHypothesisRoadmap(
  workspaceId: string,
  actorId: string,
  hypothesisId: string,
  roadmapItemId: string,
) {
  try {
    await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      if (!(await repo.hypothesisExists(client, hypothesisId))) {
        throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
      }
      if (!(await repo.roadmapItemExists(client, roadmapItemId))) {
        throw new AppError(404, 'NOT_FOUND', 'Item de roadmap não encontrado');
      }
      await repo.linkHypothesisRoadmap(client, workspaceId, hypothesisId, roadmapItemId);
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function unlinkHypothesisRoadmap(
  workspaceId: string,
  actorId: string,
  hypothesisId: string,
  roadmapItemId: string,
) {
  const removed = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.unlinkHypothesisRoadmap(client, hypothesisId, roadmapItemId),
  );
  if (!removed) throw new AppError(404, 'NOT_FOUND', 'Vínculo não encontrado');
}
