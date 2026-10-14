// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isLibraryAmountLookupQuestion } from './library-amount-extractive-query.js';

describe('isLibraryAmountLookupQuestion', () => {
  it('detects Gesamtbrutto payroll questions', () => {
    expect(
      isLibraryAmountLookupQuestion(
        'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?'
      )
    ).toBe(true);
  });

  it('detects tax amount questions without matching document-type titles', () => {
    expect(
      isLibraryAmountLookupQuestion('Wie viel Lohnsteuer wurde insgesamt einbehalten?')
    ).toBe(true);
  });

  it('ignores weather chit-chat', () => {
    expect(isLibraryAmountLookupQuestion('Wie wird das Wetter morgen?')).toBe(false);
  });
});
