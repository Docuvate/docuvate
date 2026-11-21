// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserSettingsDto } from '@docuvate/contracts';

import i18n, { LOCALE_STORAGE_KEY } from '../i18n';
import { documentLanguageForLocale } from './documentLanguage';
import { applyThemePreference } from './docuvateTheme';

/** Prefer account locale, then localStorage, else seed from the browser language (de/en). */
export function resolveUiLocale(settings: Pick<UserSettingsDto, 'locale'>): 'de' | 'en' {
  if (settings.locale === 'de' || settings.locale === 'en') {
    return settings.locale;
  }
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'de' || stored === 'en') {
      return stored;
    }
  }
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  const browserLanguage = navigator.language || navigator.languages[0] || 'en';
  return documentLanguageForLocale(browserLanguage);
}

export function applyUserSettingsUiPreferences(settings: UserSettingsDto): 'de' | 'en' {
  const themePreference = settings.themePreference ?? 'system';
  applyThemePreference(themePreference);

  const locale = resolveUiLocale(settings);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  const current = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'de';
  if (current !== locale) {
    void i18n.changeLanguage(locale);
  }
  return locale;
}
