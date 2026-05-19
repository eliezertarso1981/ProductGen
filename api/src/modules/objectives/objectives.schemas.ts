import { z } from 'zod';

export const OBJECTIVE_STATUSES = ['draft', 'active', 'achieved', 'missed', 'cancelled'] as const;

export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const createObjectiveSchema = z
  .object({
    title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
    description: z.string().max(5000).optional(),
    horizon_start: z.string().date().optional(),
    horizon_end: z.string().date().optional(),
    pillar_id: z.string().uuid('pillar_id inválido').optional(),
    owner_id: z.string().uuid('owner_id inválido').optional(),
  })
  .refine(
    (data) => {
      if (data.horizon_start && data.horizon_end) {
        return data.horizon_end >= data.horizon_start;
      }
      return true;
    },
    { message: 'horizon_end deve ser >= horizon_start', path: ['horizon_end'] },
  );

export const updateObjectiveSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    horizon_start: z.string().date().nullable().optional(),
    horizon_end: z.string().date().nullable().optional(),
    pillar_id: z.string().uuid().nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateObjectiveStatusSchema = z.object({
  status: z.enum(OBJECTIVE_STATUSES, { message: 'Status inválido' }),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
export type UpdateObjectiveStatusInput = z.infer<typeof updateObjectiveStatusSchema>;
