// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCALE_STORAGE_KEY } from '../i18n';
import { resolveUiLocale } from './syncUserUiPreferences';

describe('resolveUiLocale', () => {
  beforeEach(() => {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  });

  it('keeps an explicit account locale', () => {
    expect(resolveUiLocale({ locale: 'de' })).toBe('de');
    expect(resolveUiLocale({ locale: 'en' })).toBe('en');
  });

  it('keeps a locale already stored in localStorage', () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    vi.stubGlobal('navigator', { language: 'en-GB', languages: ['en-GB'] });
    expect(resolveUiLocale({ locale: null })).toBe('de');
  });

  it('seeds from the browser language when the account has no locale yet', () => {
    vi.stubGlobal('navigator', { language: 'de-AT', languages: ['de-AT'] });
    expect(resolveUiLocale({ locale: null })).toBe('de');
    vi.stubGlobal('navigator', { language: 'en-GB', languages: ['en-GB'] });
    expect(resolveUiLocale({ locale: null })).toBe('en');
  });
});
