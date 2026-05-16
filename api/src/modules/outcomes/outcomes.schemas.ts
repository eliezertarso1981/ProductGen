import { z } from 'zod';

export const OUTCOME_STATUSES = [
  'hypothesized',
  'measuring',
  'confirmed',
  'not_confirmed',
  'inconclusive',
] as const;

export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number];

export const createOutcomeSchema = z.object({
  hypothesized_impact: z
    .string()
    .min(10, 'hypothesized_impact deve ter pelo menos 10 caracteres'),
  key_result_id: z.string().uuid().optional(),
  pain_id: z.string().uuid().optional(),
  measurement_window_days: z.number().int().min(1).max(365).optional(),
  baseline_value: z.number().optional(),
});

export const updateOutcomeSchema = z
  .object({
    hypothesized_impact: z.string().min(10).optional(),
    key_result_id: z.string().uuid().nullable().optional(),
    pain_id: z.string().uuid().nullable().optional(),
    measurement_window_days: z.number().int().min(1).max(365).optional(),
    baseline_value: z.number().nullable().optional(),
    final_value: z.number().nullable().optional(),
    conclusion: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateOutcomeStatusSchema = z.object({
  status: z.enum(OUTCOME_STATUSES, { message: 'Status inválido' }),
});

export type CreateOutcomeInput = z.infer<typeof createOutcomeSchema>;
export type UpdateOutcomeInput = z.infer<typeof updateOutcomeSchema>;
export type UpdateOutcomeStatusInput = z.infer<typeof updateOutcomeStatusSchema>;
