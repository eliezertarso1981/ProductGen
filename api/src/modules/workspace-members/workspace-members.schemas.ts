import { z } from 'zod';

export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const createWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(WORKSPACE_ROLES).optional().default('member'),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(WORKSPACE_ROLES),
});

export type CreateWorkspaceMemberInput = z.infer<typeof createWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
