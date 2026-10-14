// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { extractGermanPeriodHints, libraryTemporalMatchBoost } from './library-temporal-match.js';

describe('libraryTemporalMatch', () => {
  it('extracts month and year from German payslip questions', () => {
    const hints = extractGermanPeriodHints(
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?'
    );
    expect(hints.some((hint) => hint.month === 10 && hint.year === 2024)).toBe(true);
  });

  it('boosts documents whose filename encodes the requested period', () => {
    const boost = libraryTemporalMatchBoost({
      query: 'Gesamtbrutto Entgeltnachweis Oktober 2024',
      filename: '2024_10.pdf',
      title: 'Entgeltnachweis',
      body: 'Gesamtbrutto 4.859,67 EUR',
      documentDate: '2024-10-31',
    });
    expect(boost).toBeGreaterThan(0.3);
  });

  it('boosts prefixed payslip filenames with embedded YYYY_MM', () => {
    const boost = libraryTemporalMatchBoost({
      query: 'Gesamtbrutto Entgeltnachweis Oktober 2024',
      filename: 'Entgeltnachweis 2024_10.pdf',
      title: 'Entgeltnachweis',
      body: '/10E Gesamtbrutto (EBeschV) 4.859,67',
      documentDate: '2024-10-31',
    });
    expect(boost).toBeGreaterThan(0.3);
  });

  it('does not boost unrelated months', () => {
    const boost = libraryTemporalMatchBoost({
      query: 'Gesamtbrutto Entgeltnachweis Oktober 2024',
      filename: '2024_09.pdf',
      title: 'Entgeltnachweis September',
      body: 'Gesamtbrutto 4.100,00 EUR',
      documentDate: '2024-09-30',
    });
    expect(boost).toBe(0);
  });
});
