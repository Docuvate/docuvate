// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scheduleApiPageScrollSync } from '../lib/apiPageScroll';
import '../styles/scalar-site-overrides.css';
import { useLocale } from '../context/LocaleContext';
import { observeScalarDeChrome } from '../lib/scalarDeDomPatch';
import {
  observeScalarSidebarAccordion,
  observeScalarSidebarSticky,
} from '../lib/scalarSidebarAccordion';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';
import {
  marketingOpenApiServerDescription,
  marketingOpenApiServerUrl,
  scalarLocaleCustomCss,
  scalarReferenceOptions,
} from '../lib/scalarSiteLocale';
import { buildScalarCustomCss } from '../lib/scalarSiteTheme';

export function ApiReferencePanel() {
  const { hash } = useLocation();
  const { locale } = useLocale();
  const { theme } = useDocuvateTheme();
  const embedRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const serverUrl = marketingOpenApiServerUrl(locale);
  const openApiSpecUrl =
    locale === 'en'
      ? `${import.meta.env.BASE_URL}openapi.en.json`
      : `${import.meta.env.BASE_URL}openapi.json`;
  const tagSlug = hash.match(/^#tag\/([^/]+)/i)?.[1] ?? '';

  useEffect(() => {
    scheduleApiPageScrollSync();
    const onHash = () => scheduleApiPageScrollSync();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [hash, locale]);

  useEffect(() => {
    const root = embedRef.current;
    if (!root) {
      return undefined;
    }
    const stopAccordion = observeScalarSidebarAccordion(root);
    const stopSticky = observeScalarSidebarSticky(root);
    const stopChrome = locale === 'de' ? observeScalarDeChrome(root) : () => undefined;
    return () => {
      stopAccordion();
      stopSticky();
      stopChrome();
    };
  }, [locale]);

  return (
    <div
      ref={embedRef}
      className={`scalar-embed scalar-embed-locale-${locale}${isDark ? ' scalar-embed-dark' : ' scalar-embed-light'}`}
    >
      <ApiReferenceReact
        key={`${locale}-${tagSlug}`}
        configuration={{
          spec: { url: openApiSpecUrl },
          theme: 'none',
          darkMode: isDark,
          baseServerURL: serverUrl,
          servers: [
            {
              url: serverUrl,
              description: marketingOpenApiServerDescription(locale),
            },
          ],
          layout: 'modern',
          hideDarkModeToggle: true,
          customCss: buildScalarCustomCss(scalarLocaleCustomCss(locale)),
          ...scalarReferenceOptions(locale),
        }}
      />
    </div>
  );
}
