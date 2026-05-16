import { z } from 'zod';

export const EVIDENCE_STATUSES = ['new', 'triaged', 'linked', 'archived'] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_SOURCES = [
  'interview',
  'support_ticket',
  'nps',
  'sales_call',
  'usage_data',
  'survey',
  'review',
  'internal',
  'other',
] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const createEvidenceSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1),
  source: z.enum(EVIDENCE_SOURCES, { message: 'source inválida' }),
  source_url: z.string().url().optional().nullable(),
  customer_identifier: z.string().optional().nullable(),
  // DB: evidences.collected_at NOT NULL
  collected_at: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateEvidenceSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(1).optional(),
    source: z.enum(EVIDENCE_SOURCES, { message: 'source inválida' }).optional(),
    source_url: z.string().url().optional().nullable(),
    customer_identifier: z.string().optional().nullable(),
    collected_at: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser informado',
  });

export const updateEvidenceStatusSchema = z.object({
  status: z.enum(EVIDENCE_STATUSES, { message: 'Status inválido' }),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;
export type UpdateEvidenceStatusInput = z.infer<typeof updateEvidenceStatusSchema>;
