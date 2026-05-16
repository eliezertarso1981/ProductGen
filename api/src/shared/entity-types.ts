export const ENTITY_TYPES = [
  'workspace',
  'product',
  'persona',
  'squad',
  'user',
  'evidence',
  'insight',
  'pain',
  'hypothesis',
  'experiment',
  'objective',
  'key_result',
  'product_metric',
  'roadmap_item',
  'prd',
  'outcome',
  'release',
  'strategic_pillar',
  'decision_log',
  'comment',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

