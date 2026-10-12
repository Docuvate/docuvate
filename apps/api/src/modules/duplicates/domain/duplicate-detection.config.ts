// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface DuplicateDetectionConfig {
  /** Minimum cosine similarity to retrieve embedding neighbors for classifier scoring. */
  embeddingThreshold: number;
  maxEmbeddingCandidates: number;
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
    embeddingThreshold: parseFloatEnv('DUPLICATE_EMBEDDING_THRESHOLD', 0.82),
    maxEmbeddingCandidates: parseIntEnv('DUPLICATE_MAX_EMBEDDING_CANDIDATES', 8),
  };
}
