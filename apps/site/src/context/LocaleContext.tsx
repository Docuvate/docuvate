import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getContent } from '../content';
import type { SiteContent } from '../content/types';
import type { SiteLocale } from '../lib/routes';
import { localeFromPathname, withLocale } from '../lib/routes';

type LocaleContextValue = {
  locale: SiteLocale;
  content: SiteContent;
  localizePath: (path: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: SiteLocale;
  children: ReactNode;
}) {
  const value = useMemo(
    (): LocaleContextValue => ({
      locale,
      content: getContent(locale),
      localizePath: (path: string) => withLocale(locale, path),
    }),
    [locale]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale requires LocaleProvider');
  }
  return ctx;
}

export function useLocaleFromLocation(pathname: string): SiteLocale {
  return localeFromPathname(pathname);
}
