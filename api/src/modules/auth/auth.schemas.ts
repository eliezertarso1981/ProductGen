import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(12, 'Senha deve ter no mínimo 12 caracteres').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
