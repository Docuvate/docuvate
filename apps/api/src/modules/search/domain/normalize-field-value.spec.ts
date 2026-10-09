// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { normalizeFieldValue, parseQueryScalarProbe } from './normalize-field-value.js';

describe('normalizeFieldValue', () => {
  it('normalizes currency amounts', () => {
    expect(normalizeFieldValue('12,50 €', 'currency').numeric).toBe(12.5);
    expect(normalizeFieldValue('EUR 12.50', 'currency').numeric).toBe(12.5);
    expect(normalizeFieldValue('1.234,56', 'currency').numeric).toBe(1234.56);
  });

  it('normalizes dates without fuzzy numeric matching', () => {
    expect(normalizeFieldValue('15.03.2024', 'date').dateIso).toBe('2024-03-15');
    expect(normalizeFieldValue('2024-03-15', 'date').dateIso).toBe('2024-03-15');
    expect(normalizeFieldValue('15. März 2024', 'date').dateIso).toBe('2024-03-15');
  });

  it('folds text for trigram search', () => {
    expect(normalizeFieldValue('Nordwind GmbH', 'text').textNorm).toBe('nordwind gmbh');
  });
});

describe('parseQueryScalarProbe', () => {
  it('detects query amount and date probes', () => {
    expect(parseQueryScalarProbe('12,50').numeric).toBe(12.5);
    expect(parseQueryScalarProbe('15.03.2024').dateIso).toBe('2024-03-15');
  });
});
