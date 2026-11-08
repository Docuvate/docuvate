// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { applyDocumentLanguage, documentLanguageForLocale } from './documentLanguage';

describe('document language', () => {
  it('maps English locales to en and everything else to de', () => {
    expect(documentLanguageForLocale('en')).toBe('en');
    expect(documentLanguageForLocale('en-US')).toBe('en');
    expect(documentLanguageForLocale('de')).toBe('de');
  });

  it('writes the active locale onto the document element', () => {
    document.documentElement.lang = 'de';
    applyDocumentLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    applyDocumentLanguage('de');
    expect(document.documentElement.lang).toBe('de');
  });
});
