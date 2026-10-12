// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cosineSimilarity } from './embedding-cosine.js';

/** Merge short follow-ups with the previous user turn when embeddings align (no keyword rules). */
export function resolveFollowUpQuery(
  currentMessage: string,
  priorUserMessage: string | null,
  embeddings: { current: number[]; prior: number[] | null }
): string {
  const current = currentMessage.trim();
  const prior = priorUserMessage?.trim() ?? '';
  if (!prior || !embeddings.prior || embeddings.prior.length === 0) {
    return current;
  }
  if (current.length > 120) {
    return current;
  }
  const sim = cosineSimilarity(embeddings.current, embeddings.prior);
  if (sim >= 0.55) {
    return `${prior} ${current}`.trim();
  }
  return current;
}
