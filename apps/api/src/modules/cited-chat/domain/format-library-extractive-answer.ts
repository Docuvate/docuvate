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

/** Turn a raw payslip line into a short cited answer sentence (value stays verbatim). */
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

  if (input.locale === 'en') {
    if (amount) {
      return `The amount is ${amount} EUR.`;
    }
    return quote.endsWith('.') ? quote : `${quote}.`;
  }

  const period = periodPhraseDe(input.userMessage);
  if (amount && normalizedQuery.includes('gesamtbrutto')) {
    if (period) {
      return `Das Gesamtbrutto im Entgeltnachweis ${period} beträgt ${amount} EUR.`;
    }
    return `Das Gesamtbrutto beträgt ${amount} EUR.`;
  }
  if (amount && normalizedQuery.includes('lohnsteuer')) {
    if (period) {
      return `Die einbehaltene Lohnsteuer laut Lohnsteuerbescheinigung ${period} beträgt insgesamt ${amount} EUR.`;
    }
    return `Die einbehaltene Lohnsteuer beträgt insgesamt ${amount} EUR.`;
  }
  if (amount && /(wie hoch|betrag|summe|wieviel|wie viel)/.test(normalizedQuery)) {
    return `Der Betrag beträgt ${amount} EUR.`;
  }
  return quote.endsWith('.') ? quote : `${quote}.`;
}
