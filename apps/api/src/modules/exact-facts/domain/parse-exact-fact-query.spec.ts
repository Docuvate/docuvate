// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { parseExactFactQuery } from './parse-exact-fact-query.js';

describe('parseExactFactQuery', () => {
  it('parses German lookup with year hint', () => {
    const parsed = parseExactFactQuery('Reingewinn 2025');
    expect(parsed).toEqual({
      kind: 'lookup',
      predicateTokens: ['reingewinn'],
      yearHint: 2025,
    });
  });

  it('parses English amount lookup', () => {
    const parsed = parseExactFactQuery('What is the net profit?');
    expect(parsed?.kind).toBe('lookup');
    expect(parsed?.predicateTokens).toContain('net');
    expect(parsed?.predicateTokens).toContain('profit');
  });

  it('detects sum aggregation', () => {
    const parsed = parseExactFactQuery('Summe aller Beträge 2024');
    expect(parsed).toEqual({
      kind: 'sum_amounts',
      predicateTokens: ['beträge'],
      yearHint: 2024,
    });
  });

  it('returns null for empty smalltalk-like input', () => {
    expect(parseExactFactQuery('hello')).toBeNull();
  });
});
