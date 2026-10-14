// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { libraryContextSearchTokens } from './library-context-search-tokens.js';

describe('libraryContextSearchTokens', () => {
  it('expands German month/year via date-fns locale parsing for payslip titles', () => {
    const tokens = libraryContextSearchTokens(
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?'
    );
    expect(tokens).toContain('10/2024');
    expect(tokens).toContain('2024-10');
    expect(tokens).toContain('2024');
  });

  it('expands English month/year phrases', () => {
    const tokens = libraryContextSearchTokens('invoice total for October 2024');
    expect(tokens).toContain('10/2024');
  });
});
