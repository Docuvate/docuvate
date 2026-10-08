import { withLocalePath } from './pathHash';

export type SiteLocale = 'de' | 'en';

export const prerenderRoutes = [
  '/',
  '/docs',
  '/docs/api',
  '/docs/sdks',
  '/impressum',
  '/datenschutz',
  '/en',
  '/en/docs',
  '/en/docs/api',
  '/en/docs/sdks',
  '/en/impressum',
  '/en/datenschutz',
] as const;

export type PrerenderRoute = (typeof prerenderRoutes)[number];

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
