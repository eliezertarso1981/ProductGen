export const SCORING_METHODS = ['rice', 'ice'] as const;
export type ScoringMethod = (typeof SCORING_METHODS)[number];

export function computePriorityScore(
  method: ScoringMethod,
  payload: Record<string, unknown>,
): number | null {
  switch (method) {
    case 'rice': {
      const reach = Number(payload.reach);
      const impact = Number(payload.impact);
      const confidence = Number(payload.confidence);
      const effort = Number(payload.effort);
      if (!Number.isFinite(reach) || !Number.isFinite(impact) || !Number.isFinite(confidence)) {
        return null;
      }
      if (!Number.isFinite(effort) || effort <= 0) return null;
      return (reach * impact * confidence) / effort;
    }
    case 'ice': {
      const impact = Number(payload.impact);
      const confidence = Number(payload.confidence);
      const ease = Number(payload.ease);
      if (!Number.isFinite(impact) || !Number.isFinite(confidence) || !Number.isFinite(ease)) {
        return null;
      }
      return (impact + confidence + ease) / 3;
    }
    default:
      return null;
  }
}
