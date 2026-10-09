// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { parseSearchScope } from './parse-search-scope.js';

describe('parseSearchScope', () => {
  it('parses scope prefixes and remaining text', () => {
    const parsed = parseSearchScope('label:finanzen rechnung');
    expect(parsed.scopes).toEqual(['labels']);
    expect(parsed.textQuery).toBe('finanzen rechnung');
  });

  it('parses custom field filters separately from scopes', () => {
    const parsed = parseSearchScope('absender:nordwind betrag:12,50');
    expect(parsed.scopes).toEqual([]);
    expect(parsed.textQuery).toBe('');
    expect(parsed.fieldFilters).toEqual([
      { fieldNameRaw: 'absender', valueRaw: 'nordwind' },
      { fieldNameRaw: 'betrag', valueRaw: '12,50' },
    ]);
  });
});
