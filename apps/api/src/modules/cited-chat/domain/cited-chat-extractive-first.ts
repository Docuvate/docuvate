// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { prefersAmountExtractiveAnswer } from './chat-answer-type-prototypes.schema.js';

/** Structured amount questions should prefer worker extractive answers over small LLM citations. */
export function preferExtractiveChatAnswer(queryVector: number[] | undefined): boolean {
  return prefersAmountExtractiveAnswer(queryVector);
}
