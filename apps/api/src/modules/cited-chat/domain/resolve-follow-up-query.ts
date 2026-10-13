// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { classifyChatRouteIntent } from './chat-intent-prototypes.schema.js';
import { cosineSimilarity } from './embedding-cosine.js';

const FOLLOW_UP_SIM_THRESHOLD = 0.55;
const SHORT_FOLLOW_UP_MAX_LEN = 80;

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

  const standaloneIntent = classifyChatRouteIntent(embeddings.current);
  if (
    standaloneIntent === 'smalltalk' ||
    standaloneIntent === 'out_of_scope' ||
    standaloneIntent === 'stats'
  ) {
    return current;
  }

  const sim = cosineSimilarity(embeddings.current, embeddings.prior);
  if (sim >= FOLLOW_UP_SIM_THRESHOLD) {
    return `${prior} ${current}`.trim();
  }

  if (
    current.length <= SHORT_FOLLOW_UP_MAX_LEN &&
    classifyChatRouteIntent(embeddings.prior) === 'document_qa'
  ) {
    return `${prior} ${current}`.trim();
  }

  return current;
}
