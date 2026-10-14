// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { classifyChatRouteIntent } from './chat-intent-prototypes.schema.js';
import { cosineSimilarity } from './embedding-cosine.js';

const FOLLOW_UP_SIM_THRESHOLD = 0.72;
const SHORT_FOLLOW_UP_MAX_LEN = 48;

const COREFERENCE_PREFIX =
  /^(und|sie|es|das|der|die|dazu|davon|daraus|damit|dort|noch|auch|welche|wann|wo|wie viel|wieviel)\b/i;

function looksLikeCoreferenceFollowUp(current: string): boolean {
  const trimmed = current.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.length <= SHORT_FOLLOW_UP_MAX_LEN) {
    return true;
  }
  return COREFERENCE_PREFIX.test(trimmed);
}

/** Merge only when the current turn is a genuine follow-up (coreference or high query similarity). */
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

  if (!looksLikeCoreferenceFollowUp(current)) {
    return current;
  }

  const sim = cosineSimilarity(embeddings.current, embeddings.prior);
  if (sim >= FOLLOW_UP_SIM_THRESHOLD) {
    return `${prior} ${current}`.trim();
  }

  return current;
}
