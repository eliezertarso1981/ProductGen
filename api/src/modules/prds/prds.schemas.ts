import { z } from 'zod';

export const PRD_STATUSES = ['draft', 'reviewing', 'approved', 'archived'] as const;
export type PrdStatus = (typeof PRD_STATUSES)[number];

export const createPrdSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  assumptions: z.string().optional(),
  business_rules: z.string().optional(),
  non_functional_requirements: z.string().optional(),
  analytics_requirements: z.string().optional(),
  rollout_strategy: z.string().optional(),
  rollback_strategy: z.string().optional(),
});

export const updatePrdSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).optional(),
    assumptions: z.string().nullable().optional(),
    business_rules: z.string().nullable().optional(),
    non_functional_requirements: z.string().nullable().optional(),
    analytics_requirements: z.string().nullable().optional(),
    rollout_strategy: z.string().nullable().optional(),
    rollback_strategy: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updatePrdStatusSchema = z.object({
  status: z.enum(PRD_STATUSES),
});

export type CreatePrdInput = z.infer<typeof createPrdSchema>;
export type UpdatePrdInput = z.infer<typeof updatePrdSchema>;
export type UpdatePrdStatusInput = z.infer<typeof updatePrdStatusSchema>;
