// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SiteLocale } from './routes';

export function splitPathAndHash(path: string): { pathname: string; hash: string } {
  const hashIndex = path.indexOf('#');
  if (hashIndex === -1) {
    const pathname = path.startsWith('/') ? path : `/${path}`;
    return { pathname, hash: '' };
  }
  const pathname = path.slice(0, hashIndex) || '/';
  const hash = path.slice(hashIndex);
  return { pathname, hash };
}

export function withLocalePath(locale: SiteLocale, pathWithHash: string): string {
  const { pathname, hash } = splitPathAndHash(pathWithHash);
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (locale === 'en') {
    const base = normalized === '/' ? '/en' : `/en${normalized}`;
    return `${base}${hash}`;
  }
  return `${normalized}${hash}`;
}

export function localizedRoute(
  locale: SiteLocale,
  pathWithHash: string
): { pathname: string; hash?: string } {
  const full = withLocalePath(locale, pathWithHash);
  const { pathname, hash } = splitPathAndHash(full);
  return hash ? { pathname, hash } : { pathname };
}
