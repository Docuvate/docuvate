// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { extractionFieldValuesEquivalent } from './extraction-field-value-equivalence.js';

describe('extractionFieldValuesEquivalent', () => {
  it('treats German and ISO dates as equal', () => {
    expect(
      extractionFieldValuesEquivalent('global:datum', '15.03.2024', '2024-03-15')
    ).toBe(true);
  });

  it('treats trimmed vendor strings as equal', () => {
    expect(
      extractionFieldValuesEquivalent('global:absender', 'Nordwind GmbH ', 'Nordwind GmbH')
    ).toBe(true);
  });

  it('detects real value changes', () => {
    expect(
      extractionFieldValuesEquivalent('global:absender', 'Nordwind GmbH', 'Südwind AG')
    ).toBe(false);
  });
});
