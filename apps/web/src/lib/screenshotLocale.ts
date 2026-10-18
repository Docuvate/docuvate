// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { LOCALE_STORAGE_KEY } from '../i18n';

/** Playwright init script: force UI locale before app boot. */
export function playwrightLocaleInitScript(locale: 'de' | 'en'): string {
  const code = locale === 'de' ? 'de' : 'en';
  return `(() => {
    localStorage.setItem('${LOCALE_STORAGE_KEY}', '${code}');
  })();`;
}
