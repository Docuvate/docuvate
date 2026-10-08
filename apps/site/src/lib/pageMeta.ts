import { getContent } from '../content';
import { localeFromPathname, stripLocalePrefix } from './routes';

export type PageHelmet = {
  title: string;
  description: string;
  lang: 'de' | 'en';
};

export function pageMetaForPath(pathname: string): PageHelmet {
  const locale = localeFromPathname(pathname);
  const content = getContent(locale);
  const path = stripLocalePrefix(pathname);

  switch (path) {
    case '/':
      return { title: content.landing.meta.title, description: content.landing.meta.description, lang: locale };
    case '/docs':
      return { title: content.docs.meta.title, description: content.docs.meta.description, lang: locale };
    case '/docs/api':
      return {
        title: `${content.nav.api} | Docuvate`,
        description: content.apiPage.lead,
        lang: locale,
      };
    case '/docs/sdks':
      return { title: content.sdks.meta.title, description: content.sdks.meta.description, lang: locale };
    case '/impressum':
      return {
        title: content.legal.imprint.title,
        description: content.legal.imprint.ddgFallback,
        lang: locale,
      };
    case '/datenschutz':
      return {
        title: content.legal.privacy.title,
        description: content.legal.privacy.paragraphs[0] ?? content.legal.privacy.title,
        lang: locale,
      };
    default:
      return { title: 'Docuvate', description: content.landing.meta.description, lang: locale };
  }
}
