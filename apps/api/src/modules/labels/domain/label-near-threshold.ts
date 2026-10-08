/** Default cosine similarity for “near label space” (Labelraum + assign recommendations). */
export const DEFAULT_LABEL_NEAR_SIMILARITY_THRESHOLD = 0.62;

export const LABEL_NEAR_THRESHOLD_MIN = 0.5;
export const LABEL_NEAR_THRESHOLD_MAX = 0.92;

const LEARN_BLEND = 0.35;

export function clampLabelNearThreshold(value: number): number {
  return Math.min(LABEL_NEAR_THRESHOLD_MAX, Math.max(LABEL_NEAR_THRESHOLD_MIN, value));
}

/**
 * Update stored threshold from accept/dismiss on embedding-based assign recommendations.
 * Accept → user accepts at this similarity; threshold may move down slightly.
 * Dismiss → user rejects at this similarity; threshold moves up.
 */
export function adjustLabelNearThresholdFromFeedback(
  current: number,
  similarity: number,
  outcome: 'accept' | 'dismiss'
): number {
  const base = clampLabelNearThreshold(current);
  const sim = Math.min(1, Math.max(0, similarity));
  let target: number;
  if (outcome === 'accept') {
    target = Math.min(base, sim - 0.01);
  } else {
    target = Math.max(base, sim + 0.03);
  }
  target = clampLabelNearThreshold(target);
  return base + (target - base) * LEARN_BLEND;
}
