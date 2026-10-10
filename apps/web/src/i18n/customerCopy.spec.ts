// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import de from './locales/de.json';
import en from './locales/en.json';

const DASH_RE = /[\u2013\u2014]/;

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, out);
    }
  }
}

describe('customer-facing i18n copy', () => {
  it('does not use em dash or en dash in de.json or en.json', () => {
    const strings: string[] = [];
    collectStrings(de, strings);
    collectStrings(en, strings);
    const offenders = strings.filter((s) => DASH_RE.test(s));
    expect(offenders).toEqual([]);
  });
});
