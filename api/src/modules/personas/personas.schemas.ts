import { z } from 'zod';

const metadataSchema = z.record(z.unknown()).optional();

export const createPersonaSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  description: z.string().max(2000).optional(),
  segment_size_estimate: z.number().int().nonnegative().optional(),
  metadata: metadataSchema,
});

export const updatePersonaSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    segment_size_estimate: z.number().int().nonnegative().nullable().optional(),
    metadata: metadataSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreatePersonaInput = z.infer<typeof createPersonaSchema>;
export type UpdatePersonaInput = z.infer<typeof updatePersonaSchema>;
