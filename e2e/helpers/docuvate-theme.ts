// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Page } from '@playwright/test';

const THEME_PREFERENCE_STORAGE_KEY = 'docuvate-theme-preference';
const COMPACT_THEME_STORAGE_KEY = 'docuvate-theme';
const THEME_ATTRIBUTE = 'data-docuvate-theme';
const LOCALE_STORAGE_KEY = 'docuvate.locale';

export async function applyDocuvateThemePreference(
  page: Page,
  preference: 'light' | 'dark'
): Promise<void> {
  await page.emulateMedia({ colorScheme: preference });
  if (!page.url().startsWith('http')) {
    await page.goto('/');
  }
  await page.evaluate(
    ({ prefKey, compactKey, attr, resolved }) => {
      window.localStorage.setItem(prefKey, resolved);
      window.localStorage.setItem(compactKey, resolved);
      document.documentElement.setAttribute(attr, resolved);
    },
    {
      prefKey: THEME_PREFERENCE_STORAGE_KEY,
      compactKey: COMPACT_THEME_STORAGE_KEY,
      attr: THEME_ATTRIBUTE,
      resolved: preference,
    }
  );
}

export async function readDocBodyBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

export async function applyDocuvateLocale(page: Page, locale: 'de' | 'en'): Promise<void> {
  await page.evaluate(
    ({ key, loc }) => {
      window.localStorage.setItem(key, loc);
    },
    { key: LOCALE_STORAGE_KEY, loc: locale }
  );
}
