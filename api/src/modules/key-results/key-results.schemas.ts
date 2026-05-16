import { z } from 'zod';

export const createKeyResultSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  metric_type: z.string().max(100).optional(),
  baseline: z.number().optional(),
  target: z.number().optional(),
  current_value: z.number().optional(),
  unit: z.string().max(50).optional(),
});

export const updateKeyResultSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    metric_type: z.string().max(100).nullable().optional(),
    baseline: z.number().nullable().optional(),
    target: z.number().nullable().optional(),
    current_value: z.number().nullable().optional(),
    unit: z.string().max(50).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>;
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>;
