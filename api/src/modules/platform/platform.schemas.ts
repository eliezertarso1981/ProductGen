import { z } from 'zod';
import { ENTITY_TYPES } from '../../shared/entity-types';

export const VISIBILITY_LEVELS = ['public', 'private', 'restricted'] as const;
export const ASSET_ATTACHABLE_TYPES = [
  'evidence',
  'pain',
  'hypothesis',
  'experiment',
  'roadmap_item',
  'outcome',
  'objective',
  'key_result',
  'product',
  'prd',
  'release',
  'strategic_pillar',
] as const;

export const entityParamsSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES, { message: 'entity_type inválido' }),
  entity_id: z.string().uuid('entity_id inválido'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comentário não pode ser vazio').max(10000),
  parent_comment_id: z.string().uuid().optional(),
  visibility: z.enum(VISIBILITY_LEVELS).optional(),
});

export const createAssignmentSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    squad_id: z.string().uuid().optional(),
    assignment_role: z.string().min(1).max(80),
    is_primary: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((data) => data.user_id || data.squad_id, {
    message: 'Informe user_id ou squad_id',
  });

export const createDecisionLogSchema = z.object({
  decision_type: z.string().min(1).max(120),
  title: z.string().min(3).max(200),
  rationale: z.string().min(1).max(10000),
  impact_analysis: z.string().max(10000).optional(),
});

export const createMediaAssetSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(120),
  size_bytes: z.number().int().nonnegative(),
  checksum_sha256: z.string().max(128).optional(),
  storage_provider: z.string().min(1).max(80),
  storage_bucket: z.string().min(1).max(255),
  storage_key: z.string().min(1).max(1000),
  asset_type: z.string().max(80).optional(),
  thumbnail_key: z.string().max(1000).optional(),
  transcript: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const attachAssetSchema = z.object({
  asset_id: z.string().uuid(),
  role: z.string().min(1).max(80).optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type CreateDecisionLogInput = z.infer<typeof createDecisionLogSchema>;
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;
export type AttachAssetInput = z.infer<typeof attachAssetSchema>;

