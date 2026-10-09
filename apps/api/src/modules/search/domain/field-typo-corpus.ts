// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Field-value search evaluation (recognized + label custom fields). */
export interface FieldTypoCorpusCase {
  id: string;
  locale: 'de' | 'en';
  query: string;
  /** Document title substring for disambiguation in tests. */
  expectedTitleNeedle: string;
  /** Field value substring expected in hit snippet. */
  expectedValueNeedle: string;
}

export const FIELD_TYPO_SEARCH_CORPUS: FieldTypoCorpusCase[] = [
  {
    id: 'f-de-01',
    locale: 'de',
    query: 'Nordwnd',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: 'Nordwind',
  },
  {
    id: 'f-de-02',
    locale: 'de',
    query: 'absender:nordwnd',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: 'Nordwind',
  },
  {
    id: 'f-de-03',
    locale: 'de',
    query: 'betrag:12,50',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: '12,50',
  },
  {
    id: 'f-de-04',
    locale: 'de',
    query: '12.50',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: '12,50',
  },
  {
    id: 'f-de-05',
    locale: 'de',
    query: '15.03.2024',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: '2024',
  },
  {
    id: 'f-de-06',
    locale: 'de',
    query: '2024-03-15',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: '03',
  },
  {
    id: 'f-de-07',
    locale: 'de',
    query: 'DE89370400440532013000',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: 'DE89',
  },
  {
    id: 'f-de-08',
    locale: 'de',
    query: 'Rechnungsnummer:INV-2024',
    expectedTitleNeedle: 'Rechnung Nordwind',
    expectedValueNeedle: 'INV',
  },
  {
    id: 'f-en-01',
    locale: 'en',
    query: 'absender:acm',
    expectedTitleNeedle: 'Invoice Acme',
    expectedValueNeedle: 'Acme',
  },
  {
    id: 'f-en-02',
    locale: 'en',
    query: 'betrag:99.00',
    expectedTitleNeedle: 'Invoice Acme',
    expectedValueNeedle: '99',
  },
  {
    id: 'f-en-03',
    locale: 'en',
    query: 'March 15, 2024',
    expectedTitleNeedle: 'Invoice Acme',
    expectedValueNeedle: '2024',
  },
  {
    id: 'f-en-04',
    locale: 'en',
    query: 'absender:acm',
    expectedTitleNeedle: 'Invoice Acme',
    expectedValueNeedle: 'Acme',
  },
];

export function recallFieldAtK(
  hits: Array<{ title: string; snippet: string }>,
  expectedTitleNeedle: string,
  expectedValueNeedle: string,
  k: number
): boolean {
  const top = hits.slice(0, k);
  return top.some(
    (hit) =>
      hit.title.toLowerCase().includes(expectedTitleNeedle.toLowerCase()) &&
      hit.snippet.toLowerCase().includes(expectedValueNeedle.toLowerCase())
  );
}
