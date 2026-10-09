import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import '../styles/scalar-site-overrides.css';
import openApiSpecDe from '../generated/openapi.v1.json';
import openApiSpecEn from '../generated/openapi.v1.en.json';
import { useLocale } from '../context/LocaleContext';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';
import {
  marketingOpenApiServerDescription,
  marketingOpenApiServerUrl,
  scalarLocaleCustomCss,
  scalarReferenceOptions,
} from '../lib/scalarSiteLocale';
import { buildScalarCustomCss } from '../lib/scalarSiteTheme';

export function ApiReferencePanel() {
  const { locale } = useLocale();
  const { theme } = useDocuvateTheme();
  const openApiSpec = locale === 'en' ? openApiSpecEn : openApiSpecDe;
  const isDark = theme === 'dark';
  const serverUrl = marketingOpenApiServerUrl(locale);

  return (
    <div
      className={`scalar-embed scalar-embed-locale-${locale}${isDark ? ' scalar-embed-dark' : ' scalar-embed-light'}`}
    >
      <ApiReferenceReact
        key={locale}
        configuration={{
          spec: { content: openApiSpec },
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
