import { pool } from '../../db/pool';
import { withWorkspaceTx } from '../../db/tx';
import { AppError, mapDbError } from '../../shared/errors';
import { computePriorityScore } from '../../shared/scoring';
import type { UpdateScoringInput } from '../../shared/scoring.schemas';
import { parseScoringInput } from '../../shared/scoring.schemas';
import {
  CreateHypothesisInput,
  UpdateHypothesisInput,
  UpdateHypothesisStatusInput,
  STATUSES_REQUIRING_SUMMARY,
} from './hypotheses.schemas';
import * as repo from './hypotheses.repo';

export async function listHypotheses(workspaceId: string, actorId: string, productId: string) {
  return withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findHypothesesByProduct(client, productId),
  );
}

export async function getHypothesis(workspaceId: string, actorId: string, id: string) {
  const hypothesis = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.findHypothesisById(client, id),
  );
  if (!hypothesis) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
  return hypothesis;
}

export async function createHypothesis(
  workspaceId: string,
  actorId: string,
  productId: string,
  input: CreateHypothesisInput,
) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.createHypothesis(client, {
        workspace_id: workspaceId,
        product_id: productId,
        ...input,
      }),
    );
  } catch (err) {
    mapDbError(err);
  }
}

export async function updateHypothesis(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateHypothesisInput,
) {
  try {
    const hypothesis = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateHypothesis(client, id, input),
    );
    if (!hypothesis) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
    return hypothesis;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function transitionHypothesisStatus(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateHypothesisStatusInput,
) {
  // Valida antecipadamente antes de chegar no banco
  if (STATUSES_REQUIRING_SUMMARY.includes(input.status) && !input.outcome_summary?.trim()) {
    throw new AppError(
      422,
      'REASON_REQUIRED',
      `outcome_summary é obrigatório ao marcar como "${input.status}"`,
    );
  }

  try {
    const hypothesis = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateHypothesisStatus(client, id, input.status, input.outcome_summary),
    );
    if (!hypothesis) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
    return hypothesis;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

// Clona uma hipótese para preservar linhagem ao reabrir uma invalidada.
// A cópia começa em "formulated" com cloned_from_id apontando para a original.
export async function cloneHypothesis(workspaceId: string, actorId: string, id: string) {
  try {
    return await withWorkspaceTx(pool, workspaceId, actorId, async (client) => {
      const original = await repo.findHypothesisById(client, id);
      if (!original) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');

      return repo.createHypothesis(client, {
        workspace_id: original.workspace_id,
        product_id: original.product_id,
        title: original.title,
        if_clause: original.if_clause,
        then_clause: original.then_clause,
        because_clause: original.because_clause,
        assumptions: original.assumptions,
        confidence: original.confidence ?? undefined,
        owner_id: original.owner_id ?? undefined,
        cloned_from_id: original.id,
      });
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function updateHypothesisScoring(
  workspaceId: string,
  actorId: string,
  id: string,
  input: UpdateScoringInput,
) {
  const priorityScore = computePriorityScore(input.method, input.payload);
  if (priorityScore === null) {
    throw new AppError(422, 'INVALID_SCORING', 'Payload de scoring inválido para o método');
  }

  try {
    const hypothesis = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
      repo.updateHypothesisScoring(client, id, input.method, input.payload, priorityScore),
    );
    if (!hypothesis) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
    return hypothesis;
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export { parseScoringInput };

export async function deleteHypothesis(workspaceId: string, actorId: string, id: string) {
  const deleted = await withWorkspaceTx(pool, workspaceId, actorId, (client) =>
    repo.softDeleteHypothesis(client, id),
  );
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Hipótese não encontrada');
}
