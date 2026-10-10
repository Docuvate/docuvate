// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { formatExtractedFieldDisplayValue } from './formatExtractedFieldDisplayValue';

describe('formatExtractedFieldDisplayValue', () => {
  it('formats amount for German locale', () => {
    expect(formatExtractedFieldDisplayValue('amount', '1240.00', 'de')).toBe('1.240,00 EUR');
  });

  it('formats amount for English locale', () => {
    expect(formatExtractedFieldDisplayValue('amount', '1240.00', 'en')).toBe('EUR 1,240.00');
  });

  it('passes through non-amount fields', () => {
    expect(formatExtractedFieldDisplayValue('vendor', 'Acme GmbH', 'de')).toBe('Acme GmbH');
  });

  it('formats brutto amounts in de-DE', () => {
    expect(formatExtractedFieldDisplayValue('brutto', '12500.00', 'de')).toBe('12.500,00 EUR');
  });
});
