// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserSettingsDto } from '@docuvate/contracts';

import i18n, { LOCALE_STORAGE_KEY } from '../i18n';
import { applyThemePreference } from './docuvateTheme';

export function applyUserSettingsUiPreferences(settings: UserSettingsDto): void {
  const themePreference = settings.themePreference ?? 'system';
  applyThemePreference(themePreference);

  if (settings.locale === 'de' || settings.locale === 'en') {
    void i18n.changeLanguage(settings.locale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, settings.locale);
  }
}
