// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveUiLocale } from './syncUserUiPreferences';

describe('resolveUiLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps an explicit account locale', () => {
    expect(resolveUiLocale({ locale: 'de' })).toBe('de');
    expect(resolveUiLocale({ locale: 'en' })).toBe('en');
  });

  it('seeds from the browser language when the account has no locale yet', () => {
    vi.stubGlobal('navigator', { language: 'de-AT', languages: ['de-AT'] });
    expect(resolveUiLocale({ locale: null })).toBe('de');
    vi.stubGlobal('navigator', { language: 'en-GB', languages: ['en-GB'] });
    expect(resolveUiLocale({ locale: null })).toBe('en');
  });
});
