// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { damerauLevenshtein, isTypoWithinDistance } from './damerau-levenshtein.js';

describe('damerauLevenshtein', () => {
  it('counts adjacent transposition as distance 1', () => {
    expect(damerauLevenshtein('rehcnung', 'rechnung')).toBe(1);
  });

  it('treats Nordwnd vs Nordwind as distance 1', () => {
    expect(isTypoWithinDistance('nordwnd', 'nordwind', 1)).toBe(true);
  });
});
