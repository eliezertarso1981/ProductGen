import { z } from 'zod';

export const createReleaseSchema = z.object({
  version: z.string().min(1).max(50),
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  planned_release_date: z.string().date().optional(),
  actual_release_date: z.string().date().optional(),
  changelog: z.string().optional(),
});

export const updateReleaseSchema = z
  .object({
    title: z.string().max(200).nullable().optional(),
    description: z.string().max(5000).nullable().optional(),
    planned_release_date: z.string().date().nullable().optional(),
    actual_release_date: z.string().date().nullable().optional(),
    changelog: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;
