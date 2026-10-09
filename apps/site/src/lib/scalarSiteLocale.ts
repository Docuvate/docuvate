import type { SiteLocale } from './routes';

/** Scalar reference config subset used by the marketing embed. */
export type ScalarReferenceConfiguration = {
  hideClientButton: true;
  hiddenClients: true;
  hideModels: true;
  hideTestRequestButton: true;
  hideDownloadButton: false;
};

export const MARKETING_OPENAPI_SERVER_URL_DE = 'https://ihre-instanz.example/v1';
export const MARKETING_OPENAPI_SERVER_URL_EN = 'https://your-instance.example/v1';

export function marketingOpenApiServerUrl(locale: SiteLocale): string {
  return locale === 'de' ? MARKETING_OPENAPI_SERVER_URL_DE : MARKETING_OPENAPI_SERVER_URL_EN;
}

export function marketingOpenApiServerDescription(locale: SiteLocale): string {
  return locale === 'de'
    ? 'Beispiel-URL Ihrer selbst gehosteten API (in docker compose durch Ihre Domain ersetzen).'
    : 'Example URL for your self-hosted API (replace with your domain in docker compose).';
}

/** Scalar has no full i18n; hide English-only chrome and patch labels via CSS where needed. */
export function scalarReferenceOptions(_locale: SiteLocale): ScalarReferenceConfiguration {
  return {
    hideClientButton: true,
    hiddenClients: true,
    hideModels: true,
    hideTestRequestButton: true,
    hideDownloadButton: false,
  };
}

export function scalarLocaleCustomCss(locale: SiteLocale): string {
  if (locale === 'en') {
    return '';
  }
  return `
    .scalar-embed-locale-de .sidebar-search-placeholder {
      font-size: 0;
      line-height: 0;
    }
    .scalar-embed-locale-de .sidebar-search-placeholder::after {
      content: 'Suchen';
      font-size: var(--scalar-font-size-2, 0.875rem);
      line-height: 1.25rem;
    }
    .scalar-embed-locale-de .introduction-card label.bg-b-2 {
      font-size: 0;
    }
    .scalar-embed-locale-de .introduction-card label.bg-b-2::after {
      content: 'API-Server';
      font-size: 0.875rem;
      font-weight: 500;
    }
    .scalar-embed-locale-de .introduction-card > div:nth-child(2):has(.scalar-card) {
      display: none !important;
    }
    .scalar-embed-locale-de .introduction-card-item {
      display: none !important;
    }
    .scalar-embed-locale-de a.download-button,
    .scalar-embed-locale-de button.download-button,
    .scalar-embed-locale-de .download .download-button {
      font-size: 0 !important;
      line-height: 0 !important;
      display: inline-block;
      vertical-align: baseline;
    }
    .scalar-embed-locale-de a.download-button::after,
    .scalar-embed-locale-de button.download-button::after,
    .scalar-embed-locale-de .download .download-button::after {
      content: 'OpenAPI-Dokument herunterladen';
      font-size: var(--scalar-font-size-2, 0.875rem);
      line-height: 1.25rem;
      color: var(--scalar-link-color, var(--scalar-color-accent)) !important;
      cursor: pointer;
      text-decoration: none;
    }
    .scalar-embed-locale-de a.download-button:hover::after,
    .scalar-embed-locale-de button.download-button:hover::after,
    .scalar-embed-locale-de .download .download-button:hover::after {
      text-decoration: underline;
      text-underline-offset: 0.15em;
    }
    .scalar-embed-locale-de a.download-button:focus-visible,
    .scalar-embed-locale-de button.download-button:focus-visible {
      outline: 2px solid var(--scalar-color-accent, #cb3a00);
      outline-offset: 3px;
      border-radius: 2px;
    }
    .scalar-embed-locale-de .scalar-card.scalar-card-sticky > .scalar-card-header,
    .scalar-embed-locale-de .introduction-card .scalar-card-sticky > .scalar-card-header {
      font-size: 0 !important;
      line-height: 0 !important;
      color: transparent !important;
    }
    .scalar-embed-locale-de .scalar-card.scalar-card-sticky > .scalar-card-header::after,
    .scalar-embed-locale-de .introduction-card .scalar-card-sticky > .scalar-card-header::after {
      content: 'Operationen';
      display: block;
      font-size: var(--scalar-font-size-2, 0.875rem);
      font-weight: var(--scalar-font-medium, 600);
      line-height: 1.25rem;
      padding: 0.75rem 1rem 0.25rem;
      color: var(--scalar-color-1, inherit);
    }
  `;
}
