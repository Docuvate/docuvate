// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './embedding-cosine.js';

export interface PrototypeClassifierConfig {
  prototypes: Record<string, number[]>;
  minScore: number;
  minMargin: number;
  defaultKey: string;
}

export function classifyByEmbeddingPrototypes(
  queryVector: number[],
  config: PrototypeClassifierConfig
): string {
  const scored = Object.entries(config.prototypes)
    .map(([key, vec]) => ({ key, score: cosineSimilarity(queryVector, vec) }))
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return config.defaultKey;
  }
  const best = scored[0];
  const second = scored[1]?.score ?? 0;
  if (best.score < config.minScore || best.score - second < config.minMargin) {
    return config.defaultKey;
  }
  return best.key;
}
