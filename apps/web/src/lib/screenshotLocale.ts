import { LOCALE_STORAGE_KEY } from '../i18n';

/** Playwright init script: force UI locale before app boot. */
export function playwrightLocaleInitScript(locale: 'de' | 'en'): string {
  const code = locale === 'de' ? 'de' : 'en';
  return `(() => {
    localStorage.setItem('${LOCALE_STORAGE_KEY}', '${code}');
  })();`;
}
