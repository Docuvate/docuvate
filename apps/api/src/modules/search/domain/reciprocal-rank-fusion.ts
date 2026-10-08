export interface RankedItem {
  id: string;
  rank: number;
}

const DEFAULT_K = 60;

/** Reciprocal rank fusion across multiple ranked lists (same id may appear in multiple lists). */
export function reciprocalRankFusion(
  lists: RankedItem[][],
  k = DEFAULT_K
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const list of lists) {
    for (const { id, rank } of list) {
      const prev = scores.get(id) ?? 0;
      scores.set(id, prev + 1 / (k + rank));
    }
  }
  return scores;
}

export function sortByFusionScore(
  ids: string[],
  scores: Map<string, number>
): string[] {
  return [...ids].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
}
