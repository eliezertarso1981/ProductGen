import { z } from 'zod';

export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer', 'guest'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Função de produto no workspace (distinta de role = permissão). */
export const WORKSPACE_JOB_FUNCTIONS = ['CEO', 'CPO', 'GPM', 'PM', 'PD', 'UX', 'PO'] as const;
export type WorkspaceJobFunction = (typeof WORKSPACE_JOB_FUNCTIONS)[number];

const jobFunctionSchema = z.enum(WORKSPACE_JOB_FUNCTIONS);

export const createWorkspaceMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(WORKSPACE_ROLES).optional().default('member'),
  job_function: jobFunctionSchema.nullable().optional(),
});

export const updateWorkspaceMemberSchema = z
  .object({
    role: z.enum(WORKSPACE_ROLES).optional(),
    job_function: jobFunctionSchema.nullable().optional(),
  })
  .refine((data) => data.role !== undefined || data.job_function !== undefined, {
    message: 'Informe role e/ou job_function',
  });

export type CreateWorkspaceMemberInput = z.infer<typeof createWorkspaceMemberSchema>;
export type UpdateWorkspaceMemberInput = z.infer<typeof updateWorkspaceMemberSchema>;
