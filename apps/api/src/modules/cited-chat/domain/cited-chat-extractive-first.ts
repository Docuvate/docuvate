// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { parseExactFactQuery } from '../../exact-facts/domain/parse-exact-fact-query.js';

/** Structured fact / amount questions should prefer worker extractive answers over small LLM citations. */
export function preferExtractiveChatAnswer(userMessage: string): boolean {
  return parseExactFactQuery(userMessage) !== null;
}
