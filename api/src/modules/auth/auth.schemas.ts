import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  workspace_slug: z.string().min(1, 'workspace_slug é obrigatório'),
});

export type LoginInput = z.infer<typeof loginSchema>;
