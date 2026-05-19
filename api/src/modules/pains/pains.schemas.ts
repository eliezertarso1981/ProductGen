import { z } from 'zod';

export const PAIN_STATUSES = [
  'identified',
  'investigating',
  'prioritized',
  'addressed',
  'resolved',
  'discarded',
  'merged',
  'split',
] as const;

export type PainStatus = (typeof PAIN_STATUSES)[number];

export const createPainSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  description: z.string().optional(),
  severity: z.number().int().min(1).max(5).optional(),
  reach_estimate: z.number().int().nonnegative().optional(),
  owner_id: z.string().uuid('owner_id inválido').optional(),
});

// Todos os campos opcionais, mas ao menos um deve vir
export const updatePainSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    product_id: z.string().uuid().optional(),
    description: z.string().nullable().optional(),
    severity: z.number().int().min(1).max(5).nullable().optional(),
    reach_estimate: z.number().int().nonnegative().nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateStatusSchema = z.object({
  status: z.enum(PAIN_STATUSES, { message: 'Status inválido' }),
  // Obrigatório quando status = discarded (o banco também valida, mas validar antes é melhor UX)
  discard_reason: z.string().min(1).optional(),
});

export const mergePainsSchema = z.object({
  source_pain_ids: z
    .array(z.string().uuid())
    .min(1, 'Informe ao menos uma dor de origem'),
  reason: z.string().min(1).optional(),
});

export const splitPainSchema = z.object({
  children: z
    .array(
      z.object({
        title: z.string().min(3).max(200),
        description: z.string().optional(),
      }),
    )
    .min(2, 'Split exige ao menos 2 dores filhas'),
  reason: z.string().min(1).optional(),
});

export type CreatePainInput = z.infer<typeof createPainSchema>;
export type UpdatePainInput = z.infer<typeof updatePainSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type MergePainsInput = z.infer<typeof mergePainsSchema>;
export type SplitPainInput = z.infer<typeof splitPainSchema>;
