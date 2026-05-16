import { z } from 'zod';

export const EXTERNAL_PROVIDERS = ['jira', 'azure_devops'] as const;

export const createHandoffSchema = z.object({
  external_provider: z.enum(EXTERNAL_PROVIDERS).optional(),
  external_project: z.string().max(120).optional(),
  external_ticket_id: z.string().max(120).optional(),
  external_ticket_url: z.string().url().optional(),
  engineering_owner: z.string().max(200).optional(),
  handoff_notes: z.string().max(5000).optional(),
  approved_for_delivery: z.boolean().optional(),
});

export const updateHandoffSchema = z
  .object({
    external_provider: z.enum(EXTERNAL_PROVIDERS).nullable().optional(),
    external_project: z.string().max(120).nullable().optional(),
    external_ticket_id: z.string().max(120).nullable().optional(),
    external_ticket_url: z.string().url().nullable().optional(),
    engineering_owner: z.string().max(200).nullable().optional(),
    handoff_notes: z.string().max(5000).nullable().optional(),
    approved_for_delivery: z.boolean().optional(),
    synced_at: z.string().datetime().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export type CreateHandoffInput = z.infer<typeof createHandoffSchema>;
export type UpdateHandoffInput = z.infer<typeof updateHandoffSchema>;
