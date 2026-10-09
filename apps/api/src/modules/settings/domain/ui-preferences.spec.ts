// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_PREFERENCE, isThemePreference, isUiLocale } from './ui-preferences.js';

describe('ui-preferences', () => {
  it('validates theme and locale enums', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('auto')).toBe(false);
    expect(isUiLocale('de')).toBe(true);
    expect(isUiLocale('fr')).toBe(false);
    expect(DEFAULT_THEME_PREFERENCE).toBe('system');
  });
});
