import { z } from 'zod';
import { SCORING_METHODS } from './scoring';

const ricePayloadSchema = z.object({
  reach: z.number().nonnegative(),
  impact: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  effort: z.number().positive(),
});

const icePayloadSchema = z.object({
  impact: z.number().nonnegative(),
  confidence: z.number().nonnegative(),
  ease: z.number().nonnegative(),
});

export const updateScoringSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('rice'),
    payload: ricePayloadSchema,
  }),
  z.object({
    method: z.literal('ice'),
    payload: icePayloadSchema,
  }),
]);

export type UpdateScoringInput = z.infer<typeof updateScoringSchema>;

export function parseScoringInput(data: unknown): UpdateScoringInput {
  const base = z
    .object({
      method: z.enum(SCORING_METHODS),
      payload: z.record(z.unknown()),
    })
    .parse(data);

  return updateScoringSchema.parse({ method: base.method, payload: base.payload });
}
