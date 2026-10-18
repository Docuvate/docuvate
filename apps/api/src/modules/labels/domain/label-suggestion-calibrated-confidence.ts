// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface LabelSuggestionScoreRow {
  tagId: string;
  rawConfidence: number;
}

const MIN_COMPETING_MARGIN = 0.03;

/** Conservative display / batch-accept confidence using per-label LTT thresholds when present. */
export function calibratedLabelSuggestionConfidence(input: {
  tagId: string;
  rawConfidence: number;
  ranked: readonly LabelSuggestionScoreRow[];
  fineThresholds: ReadonlyMap<string, number>;
}): number {
  const sorted = [...input.ranked].sort((a, b) => b.rawConfidence - a.rawConfidence);
  const runnerUp = sorted.find((row) => row.tagId !== input.tagId)?.rawConfidence ?? 0;
  const margin = input.rawConfidence - runnerUp;
  const threshold = input.fineThresholds.get(input.tagId);
  if (threshold == null) {
    if (margin < MIN_COMPETING_MARGIN && sorted.length > 1) {
      return Math.min(input.rawConfidence, 0.82);
    }
    return input.rawConfidence;
  }
  if (input.rawConfidence < threshold) {
    return Math.min(input.rawConfidence, 0.85);
  }
  if (margin < MIN_COMPETING_MARGIN && sorted.length > 1) {
    return Math.min(input.rawConfidence, 0.88);
  }
  return input.rawConfidence;
}

export function labelSuggestionMeetsBatchThreshold(input: {
  tagId: string;
  rawConfidence: number;
  minConfidence: number;
  ranked: readonly LabelSuggestionScoreRow[];
  fineThresholds: ReadonlyMap<string, number>;
}): boolean {
  const calibrated = calibratedLabelSuggestionConfidence({
    tagId: input.tagId,
    rawConfidence: input.rawConfidence,
    ranked: input.ranked,
    fineThresholds: input.fineThresholds,
  });
  if (calibrated < input.minConfidence) {
    return false;
  }
  const threshold = input.fineThresholds.get(input.tagId);
  if (threshold != null && input.rawConfidence < threshold) {
    return false;
  }
  const sorted = [...input.ranked].sort((a, b) => b.rawConfidence - a.rawConfidence);
  if (sorted[0]?.tagId === input.tagId && sorted.length > 1) {
    const runnerUp = sorted[1]?.rawConfidence ?? 0;
    if (input.rawConfidence - runnerUp < MIN_COMPETING_MARGIN) {
      return false;
    }
  }
  return true;
}
