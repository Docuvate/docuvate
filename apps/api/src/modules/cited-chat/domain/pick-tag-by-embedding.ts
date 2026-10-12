// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './embedding-cosine.js';

export interface TagCandidate {
  id: string;
  name: string;
  vector: number[];
}

export function pickBestTag(
  queryVector: number[],
  tags: TagCandidate[],
  minScore: number
): TagCandidate | null {
  if (tags.length === 0) {
    return null;
  }
  let best: TagCandidate | null = null;
  let bestScore = -1;
  for (const tag of tags) {
    const score = cosineSimilarity(queryVector, tag.vector);
    if (score > bestScore) {
      bestScore = score;
      best = tag;
    }
  }
  if (!best || bestScore < minScore) {
    return null;
  }
  return best;
}
