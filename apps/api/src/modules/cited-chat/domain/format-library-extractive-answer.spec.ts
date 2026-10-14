// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatLibraryExtractiveAnswer } from './format-library-extractive-answer.js';

describe('formatLibraryExtractiveAnswer', () => {
  it('formats Gesamtbrutto payslip answers with period and amount', () => {
    const text = formatLibraryExtractiveAnswer({
      userMessage: 'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?',
      quote: '/10E Gesamtbrutto (EBeschV) 4.859,67 56.706,65',
      documentTitle: 'Entgeltnachweis 10/2024',
      locale: 'de',
    });
    expect(text).toContain('4.859,67');
    expect(text).toContain('Oktober 2024');
    expect(text).not.toContain('/10E');
  });

  it('formats Lohnsteuer totals for year-only questions', () => {
    const text = formatLibraryExtractiveAnswer({
      userMessage:
        'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2024 insgesamt einbehalten?',
      quote: 'Einbehaltene Lohnsteuer 12.345,67 EUR',
      documentTitle: 'Lohnsteuerbescheinigung 2024',
      locale: 'de',
    });
    expect(text).toContain('12.345,67');
    expect(text).toContain('2024');
  });
});
