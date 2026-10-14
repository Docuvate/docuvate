// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChatAnswerType } from './chat-answer-type-prototypes.schema.js';

const EU_AMOUNT = /([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/;

/** Turn a raw passage line into a short cited answer sentence (value stays verbatim). */
export function formatLibraryExtractiveAnswer(input: {
  userMessage: string;
  quote: string;
  documentTitle: string;
  locale: 'de' | 'en';
  answerType: ChatAnswerType;
}): string {
  const quote = input.quote.trim();
  if (!quote) {
    return quote;
  }
  const amountMatch = EU_AMOUNT.exec(quote);
  const amount = amountMatch?.[1] ?? null;
  const title = input.documentTitle.trim();

  if (input.locale === 'en') {
    if (amount && input.answerType === 'amount') {
      const suffix = title ? ` (${title})` : '';
      return `The amount is ${amount} EUR${suffix}.`;
    }
    return quote.endsWith('.') ? quote : `${quote}.`;
  }

  if (amount && input.answerType === 'amount') {
    if (title) {
      return `Laut „${title}" beträgt der Betrag ${amount} EUR.`;
    }
    return `Der Betrag beträgt ${amount} EUR.`;
  }
  return quote.endsWith('.') ? quote : `${quote}.`;
}
