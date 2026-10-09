// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';

const LAYOUT_RENDERED_KEYS = [
  'documents.extractedTextCopyPlain',
  'documents.layoutExportTypst',
  'documents.layoutExportTypstSemantisch',
  'documents.layoutExportTypstExakt',
  'documents.layoutIrHtmlFailedBody',
] as const;

function getNested(obj: Record<string, unknown>, dotted: string): string | undefined {
  let cur: unknown = obj;
  for (const part of dotted.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

describe('documents layout i18n', () => {
  it('defines layout tab copy in DE and EN', () => {
    for (const key of LAYOUT_RENDERED_KEYS) {
      const deVal = getNested(de as Record<string, unknown>, key);
      const enVal = getNested(en as Record<string, unknown>, key);
      expect(deVal, `${key} missing in de.json`).toBeTruthy();
      expect(enVal, `${key} missing in en.json`).toBeTruthy();
      expect(deVal).not.toBe(key);
      expect(enVal).not.toBe(key);
    }
  });
});
