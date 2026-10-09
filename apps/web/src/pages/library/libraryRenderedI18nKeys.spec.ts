// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';

/** Keys rendered in the library documents toolbar and filter mode segment. */
const LIBRARY_RENDERED_I18N_KEYS = [
  'library.filterToggle',
  'library.filterToggleCollapse',
  'library.filterToggleActive',
  'library.searchPlaceholder',
  'library.filter.modeUi',
  'library.filter.modeQuery',
] as const;

function getNested(obj: Record<string, unknown>, dotted: string): string | undefined {
  let cur: unknown = obj;
  for (const part of dotted.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

describe('library rendered i18n keys', () => {
  it('defines toolbar and filter-mode copy in DE and EN (no raw key paths)', () => {
    for (const key of LIBRARY_RENDERED_I18N_KEYS) {
      const deVal = getNested(de as Record<string, unknown>, key);
      const enVal = getNested(en as Record<string, unknown>, key);
      expect(deVal, `${key} missing in de.json`).toBeTruthy();
      expect(enVal, `${key} missing in en.json`).toBeTruthy();
      expect(deVal).not.toBe(key);
      expect(enVal).not.toBe(key);
    }
  });

  it('uses user-facing filter mode labels (not internal “UI” shorthand)', () => {
    expect(en.library.filter.modeUi).toBe('Simple');
    expect(en.library.filter.modeQuery).toBe('Advanced');
    expect(de.library.filter.modeUi).toBe('Einfach');
    expect(de.library.filter.modeQuery).toBe('Erweitert');
  });
});
