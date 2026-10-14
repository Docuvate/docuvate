// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';
import { extractGermanPeriodHints } from './library-temporal-match.js';

const EU_AMOUNT = /([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/;

function periodPhraseDe(query: string): string | null {
  const hints = extractGermanPeriodHints(query).filter((hint) => hint.year != null);
  const monthHint = hints.find((hint) => hint.month != null && hint.year != null);
  if (monthHint?.month != null && monthHint.year != null) {
    const monthNames = [
      '',
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ];
    const name = monthNames[monthHint.month] ?? String(monthHint.month);
    return `${name} ${String(monthHint.year)}`;
  }
  const yearOnly = hints.find((hint) => hint.month == null && hint.year != null);
  if (yearOnly?.year != null) {
    return String(yearOnly.year);
  }
  return null;
}

/** Turn a raw passage line into a short cited answer sentence (value stays verbatim). */
export function formatLibraryExtractiveAnswer(input: {
  userMessage: string;
  quote: string;
  documentTitle: string;
  locale: 'de' | 'en';
}): string {
  const quote = input.quote.trim();
  if (!quote) {
    return quote;
  }
  const amountMatch = EU_AMOUNT.exec(quote);
  const amount = amountMatch?.[1] ?? null;
  const normalizedQuery = normalizeSearchText(input.userMessage);
  const period = periodPhraseDe(input.userMessage);
  const title = input.documentTitle.trim();

  if (input.locale === 'en') {
    if (amount) {
      const suffix = period ? ` (${period})` : title ? ` (${title})` : '';
      return `The amount is ${amount} EUR${suffix}.`;
    }
    return quote.endsWith('.') ? quote : `${quote}.`;
  }

  if (amount && /(wie hoch|betrag|summe|wieviel|wie viel|insgesamt)/.test(normalizedQuery)) {
    if (period && title) {
      return `Laut „${title}“ (${period}) beträgt der Betrag ${amount} EUR.`;
    }
    if (period) {
      return `Für ${period} beträgt der Betrag ${amount} EUR.`;
    }
    if (title) {
      return `Laut „${title}“ beträgt der Betrag ${amount} EUR.`;
    }
    return `Der Betrag beträgt ${amount} EUR.`;
  }
  return quote.endsWith('.') ? quote : `${quote}.`;
}
