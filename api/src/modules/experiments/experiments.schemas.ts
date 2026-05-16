import { z } from 'zod';

export const EXPERIMENT_METHODS = [
  'interview',
  'prototype',
  'ab_test',
  'fake_door',
  'survey',
  'beta',
  'concierge',
  'wizard_of_oz',
  'other',
] as const;

export const EXPERIMENT_STATUSES = ['planned', 'running', 'completed', 'analyzed'] as const;

export const EXPERIMENT_RESULTS = ['validated', 'invalidated', 'inconclusive'] as const;

export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];
export type ExperimentResult = (typeof EXPERIMENT_RESULTS)[number];

export const createExperimentSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  method: z.enum(EXPERIMENT_METHODS, { message: 'Método inválido' }),
  success_criteria: z
    .string()
    .min(10, 'Critério de sucesso deve ter pelo menos 10 caracteres'),
  sample_target: z.number().int().positive().optional(),
  owner_id: z.string().uuid('owner_id inválido').optional(),
});

export const updateExperimentSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    method: z.enum(EXPERIMENT_METHODS).optional(),
    success_criteria: z.string().min(10).optional(),
    sample_target: z.number().int().positive().nullable().optional(),
    sample_actual: z.number().int().nonnegative().nullable().optional(),
    learnings: z.string().nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateExperimentStatusSchema = z
  .object({
    status: z.enum(EXPERIMENT_STATUSES, { message: 'Status inválido' }),
    result: z.enum(EXPERIMENT_RESULTS).optional(),
    learnings: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'analyzed' && !data.result) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'result é obrigatório quando status = analyzed',
        path: ['result'],
      });
    }
  });

export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>;
export type UpdateExperimentStatusInput = z.infer<typeof updateExperimentStatusSchema>;
