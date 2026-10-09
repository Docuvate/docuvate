// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { resolveThemeFromPreference } from './themePreference';

describe('resolveThemeFromPreference', () => {
  it('maps explicit light and dark', () => {
    expect(resolveThemeFromPreference('light', true)).toBe('light');
    expect(resolveThemeFromPreference('dark', false)).toBe('dark');
  });

  it('follows system when preference is system', () => {
    expect(resolveThemeFromPreference('system', true)).toBe('dark');
    expect(resolveThemeFromPreference('system', false)).toBe('light');
  });
});
