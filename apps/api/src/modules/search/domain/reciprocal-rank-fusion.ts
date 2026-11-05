// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface RankedItem {
  id: string;
  rank: number;
}

/** One ranked result list and how much it counts in the fusion. */
export interface WeightedRankedList {
  items: RankedItem[];
  weight: number;
}

const DEFAULT_K = 60;

/**
 * Weighted reciprocal rank fusion: each list adds `weight / (k + rank)` per id. The same id may
 * appear in several lists.
 */
export function reciprocalRankFusion(
  lists: WeightedRankedList[],
  k = DEFAULT_K
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const { items, weight } of lists) {
    for (const { id, rank } of items) {
      const prev = scores.get(id) ?? 0;
      scores.set(id, prev + weight / (k + rank));
    }
  }
  return scores;
}

/** Ids ordered by fused score, best first. */
export function idsByFusedScore(scores: Map<string, number>): string[] {
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
