// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { getContent } from '../content';
import { getDocsExtended } from '../content/docsExtended';
import { comparePageBySlug } from './compareData';
import { localeFromPathname, stripLocalePrefix } from './routes';
import { PUBLIC_SITE_URL } from './siteUrl';

export type PageHelmet = {
  title: string;
  description: string;
  lang: 'de' | 'en';
  canonicalPath: string;
  ogImagePath: string;
  alternateDePath: string;
  alternateEnPath: string;
};

function withTrailingSlashPath(path: string): string {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

function alternatePaths(path: string): { de: string; en: string } {
  const stripped = stripLocalePrefix(path);
  const dePath = stripped === '/' ? '/' : stripped;
  const enPath = stripped === '/' ? '/en' : `/en${stripped}`;
  return { de: dePath, en: enPath };
}

export function pageMetaForPath(pathname: string): PageHelmet {
  const locale = localeFromPathname(pathname);
  const content = getContent(locale);
  const path = stripLocalePrefix(pathname);
  const alternates = alternatePaths(pathname);
  const base = {
    lang: locale,
    canonicalPath: withTrailingSlashPath(pathname),
    ogImagePath: '/og-image.png',
    alternateDePath: alternates.de,
    alternateEnPath: alternates.en,
  };

  const docsExt = getDocsExtended(locale);

  const compareMatch = /^\/docs\/(?:vergleiche|comparisons)\/([^/]+)$/.exec(path);
  if (compareMatch) {
    const slug = compareMatch[1] ?? '';
    if (slug === 'methodik' || slug === 'methodology') {
      return {
        ...base,
        title: `${docsExt.comparisons.methodologyTitle} | Docuvate`,
        description: docsExt.comparisons.meta.description,
      };
    }
    const page = comparePageBySlug(slug);
    if (page) {
      return {
        ...base,
        title: `${page.title} | Docuvate`,
        description: page.lead,
      };
    }
  }

  const guidePages: Record<string, { title: string; description: string } | undefined> = {
    '/docs/motivation': docsExt.motivation.meta,
    '/docs/architektur': docsExt.architecture.meta,
    '/docs/architecture': docsExt.architecture.meta,
    '/docs/service-schluessel': docsExt.serviceApiKeys.meta,
    '/docs/service-api-keys': docsExt.serviceApiKeys.meta,
    '/docs/backup-und-upgrade': docsExt.backupUpgrade.meta,
    '/docs/backup-and-upgrade': docsExt.backupUpgrade.meta,
    '/docs/modelle': docsExt.models.meta,
    '/docs/models': docsExt.models.meta,
    '/docs/kubernetes': docsExt.kubernetes.meta,
  };
  const guide = guidePages[path];
  if (guide) {
    return { ...base, title: guide.title, description: guide.description };
  }

  switch (path) {
    case '/':
      return {
        ...base,
        title: content.landing.meta.title,
        description: content.landing.meta.description,
      };
    case '/docs':
      return {
        ...base,
        title: content.docs.meta.title,
        description: content.docs.meta.description,
      };
    case '/docs/api':
      return {
        ...base,
        title: `${content.nav.api} | Docuvate`,
        description: content.apiPage.lead,
      };
    case '/docs/sdks':
      return {
        ...base,
        title: content.sdks.meta.title,
        description: content.sdks.meta.description,
      };
    case '/impressum':
      return {
        ...base,
        title: content.legal.imprint.title,
        description: content.legal.imprint.ddgFallback,
      };
    case '/datenschutz':
      return {
        ...base,
        title: content.legal.privacy.title,
        description: content.legal.privacy.paragraphs[0] ?? content.legal.privacy.title,
      };
    case '/lizenz':
    case '/license':
      return {
        ...base,
        title: content.legal.license.title,
        description: content.legal.license.intro[0] ?? content.legal.license.title,
        alternateDePath: '/lizenz',
        alternateEnPath: '/en/license',
      };
    default:
      return { ...base, title: 'Docuvate', description: content.landing.meta.description };
  }
}

export function absoluteCanonicalUrl(pathname: string): string {
  const meta = pageMetaForPath(pathname);
  const path = meta.canonicalPath === '/' ? '' : meta.canonicalPath.replace(/\/$/, '');
  return `${PUBLIC_SITE_URL}${path}`;
}
