import { z } from 'zod';

export const createWorkspaceTeamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  description: z.string().max(2000).optional(),
  color: z.string().max(80).optional(),
  product_ids: z.array(z.string().uuid()).optional().default([]),
  member_ids: z.array(z.string().uuid()).optional().default([]),
});

export const updateWorkspaceTeamSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).nullable().optional(),
    color: z.string().max(80).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateWorkspaceTeamInput = z.infer<typeof createWorkspaceTeamSchema>;
export type UpdateWorkspaceTeamInput = z.infer<typeof updateWorkspaceTeamSchema>;
