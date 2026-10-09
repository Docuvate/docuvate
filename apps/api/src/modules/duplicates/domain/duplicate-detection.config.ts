// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface DuplicateDetectionConfig {
  /** Minimum cosine similarity for embedding-based duplicate candidates. */
  embeddingThreshold: number;
  maxEmbeddingCandidates: number;
  /**
   * When both documents have a known page count from extraction blocks, reject embedding
   * matches if the counts differ by at least this amount (unless similarity is very high).
   */
  pageCountMinDifference: number;
  /** Embedding similarity at or above this value bypasses the page-count gate. */
  pageCountGateMaxSimilarity: number;
}

function parseFloatEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function readDuplicateDetectionConfig(): DuplicateDetectionConfig {
  return {
    embeddingThreshold: parseFloatEnv('DUPLICATE_EMBEDDING_THRESHOLD', 0.88),
    maxEmbeddingCandidates: parseIntEnv('DUPLICATE_MAX_EMBEDDING_CANDIDATES', 8),
    pageCountMinDifference: parseIntEnv('DUPLICATE_PAGE_COUNT_MIN_DIFF', 3),
    pageCountGateMaxSimilarity: parseFloatEnv('DUPLICATE_PAGE_COUNT_GATE_MAX_SIMILARITY', 0.95),
  };
}
