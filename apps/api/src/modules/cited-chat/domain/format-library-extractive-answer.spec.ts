// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { formatLibraryExtractiveAnswer } from './format-library-extractive-answer.js';

describe('formatLibraryExtractiveAnswer', () => {
  it('formats amount answers using document title context (amount answer type)', () => {
    const text = formatLibraryExtractiveAnswer({
      userMessage: 'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?',
      quote: '/10E Gesamtbrutto (EBeschV) 5.432,10 54.321,00',
      documentTitle: 'Entgeltnachweis 10/2024',
      locale: 'de',
      answerType: 'amount',
    });
    expect(text).toContain('5.432,10');
    expect(text).toContain('Entgeltnachweis 10/2024');
    expect(text).not.toContain('/10E');
  });

  it('formats amount answers for a generic invoice field label (Rechnungsbetrag)', () => {
    const text = formatLibraryExtractiveAnswer({
      userMessage: 'Wie hoch war der Rechnungsbetrag auf der Rechnung März 2026?',
      quote: 'Rechnungsbetrag: 1.234,56 EUR',
      documentTitle: 'Rechnung INV-2026-0042',
      locale: 'de',
      answerType: 'amount',
    });
    expect(text).toContain('1.234,56');
    expect(text).toContain('Rechnung INV-2026-0042');
  });
});
