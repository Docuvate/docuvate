// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './cosine.js';

export type LabelOverlapTagInput = {
  tagId: string;
  name: string;
  centroid: number[];
  docEmbeddings: number[][];
};

export type LabelOverlapHighPair = {
  tagIdA: string;
  tagIdB: string;
  tagNameA: string;
  tagNameB: string;
  similarity: number;
  mergeRecommendationId: string;
};

export type LabelOverlapMatrix = {
  tagIds: string[];
  tagNames: string[];
  /** Row-major n×n cosine similarities in embedding space. */
  similarities: number[][];
  highOverlapPairs: LabelOverlapHighPair[];
};

const HIGH_OVERLAP_THRESHOLD = 0.78;

function averageCrossSetSimilarity(a: number[][], b: number[][]): number | null {
  if (a.length === 0 || b.length === 0) {
    return null;
  }
  let sum = 0;
  let count = 0;
  for (const va of a) {
    for (const vb of b) {
      sum += cosineSimilarity(va, vb);
      count += 1;
    }
  }
  return count > 0 ? sum / count : null;
}

function pairSimilarity(a: LabelOverlapTagInput, b: LabelOverlapTagInput): number {
  let centroidSim = 0;
  if (a.centroid.length > 0 && b.centroid.length > 0) {
    centroidSim = cosineSimilarity(a.centroid, b.centroid);
  }
  const cross = averageCrossSetSimilarity(a.docEmbeddings, b.docEmbeddings);
  const crossSim = cross ?? centroidSim;
  const hasDocs = a.docEmbeddings.length > 0 && b.docEmbeddings.length > 0;
  return hasDocs ? 0.45 * centroidSim + 0.55 * crossSim : centroidSim;
}

function mergeRecommendationId(tagIdA: string, tagIdB: string): string {
  const sorted = [tagIdA, tagIdB].sort();
  return `merge:${sorted[0]}:${sorted[1]}`;
}

export function buildLabelOverlapMatrix(tags: LabelOverlapTagInput[]): LabelOverlapMatrix | null {
  if (tags.length === 0) {
    return null;
  }

  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const n = sorted.length;
  const similarities: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const highOverlapPairs: LabelOverlapHighPair[] = [];

  for (let i = 0; i < n; i++) {
    similarities[i]![i] = 1;
    for (let j = i + 1; j < n; j++) {
      const sim = pairSimilarity(sorted[i]!, sorted[j]!);
      similarities[i]![j] = sim;
      similarities[j]![i] = sim;
      if (sim >= HIGH_OVERLAP_THRESHOLD) {
        highOverlapPairs.push({
          tagIdA: sorted[i]!.tagId,
          tagIdB: sorted[j]!.tagId,
          tagNameA: sorted[i]!.name,
          tagNameB: sorted[j]!.name,
          similarity: sim,
          mergeRecommendationId: mergeRecommendationId(sorted[i]!.tagId, sorted[j]!.tagId),
        });
      }
    }
  }

  highOverlapPairs.sort((a, b) => b.similarity - a.similarity);

  return {
    tagIds: sorted.map((t) => t.tagId),
    tagNames: sorted.map((t) => t.name),
    similarities,
    highOverlapPairs,
  };
}
