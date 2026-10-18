// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { withLocalePath } from './pathHash';
export type SiteLocale = 'de' | 'en';

export { prerenderRoutes, type PrerenderRoute } from './prerenderRoutes';

export function localeFromPathname(pathname: string): SiteLocale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'de';
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

export function withLocale(locale: SiteLocale, path: string): string {
  return withLocalePath(locale, path);
}
