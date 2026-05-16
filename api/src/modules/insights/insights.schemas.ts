import { z } from 'zod';

export const createInsightSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  description: z.string().min(1, 'Descrição é obrigatória'),
  confidence_score: z.number().min(0).max(1).optional(),
  impact_score: z.number().min(0).max(1).optional(),
  frequency_score: z.number().min(0).max(1).optional(),
  owner_id: z.string().uuid('owner_id inválido').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateInsightSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(1).optional(),
    confidence_score: z.number().min(0).max(1).nullable().optional(),
    impact_score: z.number().min(0).max(1).nullable().optional(),
    frequency_score: z.number().min(0).max(1).nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateInsightInput = z.infer<typeof createInsightSchema>;
export type UpdateInsightInput = z.infer<typeof updateInsightSchema>;
