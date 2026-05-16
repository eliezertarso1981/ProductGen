import { z } from 'zod';

export const HYPOTHESIS_STATUSES = [
  'formulated',
  'validating',
  'validated',
  'invalidated',
  'in_execution',
  'delivered',
  'deprioritized',
  'discarded',
] as const;

export type HypothesisStatus = (typeof HYPOTHESIS_STATUSES)[number];

// Estados que exigem outcome_summary explicando o motivo
const STATUSES_REQUIRING_SUMMARY: HypothesisStatus[] = ['invalidated', 'discarded'];

export const createHypothesisSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  if_clause: z.string().min(1, 'if_clause é obrigatório (Se...)'),
  then_clause: z.string().min(1, 'then_clause é obrigatório (Então...)'),
  because_clause: z.string().min(1, 'because_clause é obrigatório (Porque...)'),
  assumptions: z.array(z.unknown()).default([]),
  confidence: z.number().int().min(1).max(5).optional(),
  owner_id: z.string().uuid('owner_id inválido').optional(),
  cloned_from_id: z.string().uuid('cloned_from_id inválido').optional(),
});

export const updateHypothesisSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    if_clause: z.string().min(1).optional(),
    then_clause: z.string().min(1).optional(),
    because_clause: z.string().min(1).optional(),
    assumptions: z.array(z.unknown()).optional(),
    confidence: z.number().int().min(1).max(5).nullable().optional(),
    outcome_summary: z.string().nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateStatusSchema = z.object({
  status: z.enum(HYPOTHESIS_STATUSES, { message: 'Status inválido' }),
  // Obrigatório ao invalidar ou descartar (o banco também valida via trigger)
  outcome_summary: z.string().min(1).optional(),
});

export { STATUSES_REQUIRING_SUMMARY };
export type CreateHypothesisInput = z.infer<typeof createHypothesisSchema>;
export type UpdateHypothesisInput = z.infer<typeof updateHypothesisSchema>;
export type UpdateHypothesisStatusInput = z.infer<typeof updateStatusSchema>;
