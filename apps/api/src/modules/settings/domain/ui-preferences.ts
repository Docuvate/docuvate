// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const UI_LOCALES = ['de', 'en'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];

export function isThemePreference(value: string): value is ThemePreference {
  for (const item of THEME_PREFERENCES) {
    if (item === value) {
      return true;
    }
  }
  return false;
}

export function isUiLocale(value: string): value is UiLocale {
  for (const item of UI_LOCALES) {
    if (item === value) {
      return true;
    }
  }
  return false;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
