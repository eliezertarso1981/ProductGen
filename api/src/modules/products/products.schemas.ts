import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  vision: z.string().min(1).max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  vision: z.string().min(1).max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Provide at least one field to update',
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
