import { z } from 'zod';

const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;
const planCodes = ['starter', 'professional', 'enterprise', 'free'] as const;

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(8).max(128),
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar os Termos de Uso' }),
  }),
  marketing_opt_in: z.boolean().optional().default(false),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')
    .optional(),
  logo_url: z.string().url('URL do logo inválida').max(2048).optional().nullable(),
  company_size: z.enum(companySizes, { message: 'Tamanho da empresa inválido' }),
  country_code: z
    .string()
    .trim()
    .length(2, 'País deve ser ISO 3166-1 alpha-2')
    .transform((v) => v.toUpperCase()),
});

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    job_title: z.string().trim().max(120).nullable().optional(),
    avatar_url: z.string().url().max(2048).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const setWorkspacePlanSchema = z.object({
  plan: z.enum(planCodes, { message: 'Plano inválido' }),
  enterprise_lead: z
    .object({
      contact_name: z.string().trim().min(2).max(120),
      contact_email: z.string().trim().email(),
      contact_phone: z.string().trim().max(40).optional(),
      message: z.string().trim().max(5000).optional(),
    })
    .optional(),
});

export const enterpriseLeadSchema = z.object({
  workspace_id: z.string().uuid().optional(),
  contact_name: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email(),
  contact_phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(5000).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type SetWorkspacePlanInput = z.infer<typeof setWorkspacePlanSchema>;
export type EnterpriseLeadInput = z.infer<typeof enterpriseLeadSchema>;
