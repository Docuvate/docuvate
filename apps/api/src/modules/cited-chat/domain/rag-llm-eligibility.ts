// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  ragFusionGateThreshold,
  ragFusionSoftThreshold,
  ragRerankerGateThreshold,
  ragRerankerSoftThreshold,
} from './cited-chat-constants.js';
import { passesFusionGate, passesRerankerGate } from './verify-citation-quote.js';

export function passesCalibratedRetrievalGate(input: {
  bestScore: number;
  rerankerUsed: boolean;
}): boolean {
  return input.rerankerUsed
    ? passesRerankerGate(input.bestScore, ragRerankerGateThreshold())
    : passesFusionGate(input.bestScore, ragFusionGateThreshold());
}

/** Whether to call the LLM (soft floor + calibrated gate). Hard abstain below soft floor. */
export function shouldAttemptCitedLlm(input: {
  bestScore: number;
  rerankerUsed: boolean;
}): boolean {
  if (passesCalibratedRetrievalGate(input)) {
    return true;
  }
  if (input.rerankerUsed) {
    return input.bestScore >= ragRerankerSoftThreshold();
  }
  return input.bestScore >= ragFusionSoftThreshold();
}
