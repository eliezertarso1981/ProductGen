import { z } from 'zod';

export const DELIVERY_TYPES = ['initiative', 'epic', 'feature'] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const DELIVERY_STATUSES = [
  'proposed',
  'planned',
  'in_development',
  'in_validation',
  'delivered',
  'measuring_outcome',
  'cancelled',
  'rolled_back',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const createRoadmapItemSchema = z.object({
  parent_id: z.string().uuid('parent_id inválido').optional(),
  type: z.enum(DELIVERY_TYPES, { message: 'type deve ser initiative, epic ou feature' }),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  description: z.string().optional(),
  planned_start: z.string().date('Data inválida (use YYYY-MM-DD)').optional(),
  planned_end: z.string().date('Data inválida (use YYYY-MM-DD)').optional(),
  effort_estimate: z.string().optional(),
  priority_score: z.number().optional(),
  pillar_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  external_system: z.string().optional(),
  external_id: z.string().optional(),
  external_url: z.string().url('URL inválida').optional(),
});

export const updateRoadmapItemSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().nullable().optional(),
    planned_start: z.string().date().nullable().optional(),
    planned_end: z.string().date().nullable().optional(),
    actual_start: z.string().date().nullable().optional(),
    actual_end: z.string().date().nullable().optional(),
    effort_estimate: z.string().nullable().optional(),
    priority_score: z.number().nullable().optional(),
    pillar_id: z.string().uuid().nullable().optional(),
    owner_id: z.string().uuid().nullable().optional(),
    external_system: z.string().nullable().optional(),
    external_id: z.string().nullable().optional(),
    external_url: z.string().url().nullable().optional(),
    external_status: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateStatusSchema = z.object({
  status: z.enum(DELIVERY_STATUSES, { message: 'Status inválido' }),
  // Terminal cancelled exige cancel_reason; rolled_back exige rollback_reason
  cancel_reason: z.string().min(1).optional(),
  rollback_reason: z.string().min(1).optional(),
});

export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
export type UpdateRoadmapStatusInput = z.infer<typeof updateStatusSchema>;
