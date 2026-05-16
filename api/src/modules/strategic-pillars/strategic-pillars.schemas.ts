import { z } from 'zod';

export const createStrategicPillarSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  description: z.string().max(2000).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'color deve ser hex (#RRGGBB)')
    .optional(),
  position: z.number().int().min(0).optional(),
});

export const updateStrategicPillarSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .nullable()
      .optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateStrategicPillarInput = z.infer<typeof createStrategicPillarSchema>;
export type UpdateStrategicPillarInput = z.infer<typeof updateStrategicPillarSchema>;
