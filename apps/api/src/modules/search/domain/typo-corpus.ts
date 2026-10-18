// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Synthetic typo evaluation set (neutral invented names only). */
export interface TypoCorpusCase {
  id: string;
  locale: 'de' | 'en';
  query: string;
  /** Document title substring that should rank in top 5. */
  expectedTitleNeedle: string;
}

export const TYPO_SEARCH_CORPUS: TypoCorpusCase[] = [
  { id: 'de-01', locale: 'de', query: 'Rehcnung', expectedTitleNeedle: 'Rechnung Nordwind' },
  { id: 'de-02', locale: 'de', query: 'Beschied', expectedTitleNeedle: 'Bescheid Finanzamt' },
  { id: 'de-03', locale: 'de', query: 'Vertrga', expectedTitleNeedle: 'Vertrag Consulting' },
  { id: 'de-04', locale: 'de', query: 'Liefershein', expectedTitleNeedle: 'Lieferschein Alpha' },
  { id: 'de-05', locale: 'de', query: 'Protokl', expectedTitleNeedle: 'Protokoll Team' },
  { id: 'de-06', locale: 'de', query: 'ueberweisung', expectedTitleNeedle: 'Überweisung Konto' },
  { id: 'de-07', locale: 'de', query: 'Strasse', expectedTitleNeedle: 'Straße Muster' },
  { id: 'de-08', locale: 'de', query: 'Mahnung', expectedTitleNeedle: 'Mahnung Beta' },
  { id: 'de-09', locale: 'de', query: 'Quittung', expectedTitleNeedle: 'Quittung Werkstatt' },
  { id: 'de-10', locale: 'de', query: 'Versicherung', expectedTitleNeedle: 'Versicherung Gamma' },
  { id: 'de-11', locale: 'de', query: 'Versicherun', expectedTitleNeedle: 'Versicherung Gamma' },
  { id: 'de-12', locale: 'de', query: 'Kündigung', expectedTitleNeedle: 'Kündigung Miete' },
  { id: 'de-13', locale: 'de', query: 'Kuendigung', expectedTitleNeedle: 'Kündigung Miete' },
  {
    id: 'de-14',
    locale: 'de',
    query: 'Gehaltsabrechnung',
    expectedTitleNeedle: 'Gehaltsabrechnung',
  },
  {
    id: 'de-15',
    locale: 'de',
    query: 'Gehaltabrechnung',
    expectedTitleNeedle: 'Gehaltsabrechnung',
  },
  { id: 'en-01', locale: 'en', query: 'invioce', expectedTitleNeedle: 'Invoice Acme' },
  { id: 'en-02', locale: 'en', query: 'recipt', expectedTitleNeedle: 'Receipt Workshop' },
  { id: 'en-03', locale: 'en', query: 'contrat', expectedTitleNeedle: 'Contract Delta' },
  { id: 'en-04', locale: 'en', query: 'delivry', expectedTitleNeedle: 'Delivery Note' },
  { id: 'en-05', locale: 'en', query: 'minuts', expectedTitleNeedle: 'Minutes Board' },
  { id: 'en-06', locale: 'en', query: 'insurnace', expectedTitleNeedle: 'Insurance Policy' },
  { id: 'en-07', locale: 'en', query: 'payrol', expectedTitleNeedle: 'Payroll Summary' },
  { id: 'en-08', locale: 'en', query: 'quotaton', expectedTitleNeedle: 'Quotation Project' },
  { id: 'en-09', locale: 'en', query: 'warrenty', expectedTitleNeedle: 'Warranty Claim' },
  { id: 'en-10', locale: 'en', query: 'maintainance', expectedTitleNeedle: 'Maintenance Log' },
];

export function recallAtK(rankedTitles: string[], expectedNeedle: string, k: number): boolean {
  const top = rankedTitles.slice(0, k);
  return top.some((title) => title.toLowerCase().includes(expectedNeedle.toLowerCase()));
}
