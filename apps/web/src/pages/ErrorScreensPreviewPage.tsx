// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES } from '@docuvate/contracts';
import { Info, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { ErrorCodeDetails } from '../components/errors/ErrorCodeDetails';
import { type HttpErrorScreenVariant,HttpStatusErrorPage } from '../components/errors/HttpStatusErrorPage';
import { RouteErrorScreen } from '../components/errors/RouteErrorScreen';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const PREVIEW_VARIANTS: HttpErrorScreenVariant[] = [
  'preview-x2',
  '401',
  '403',
  '500',
  '502',
  '503',
  '429',
  'offline',
];

function isPreviewVariant(value: string | undefined): value is HttpErrorScreenVariant {
  if (value == null) {
    return false;
  }
  return PREVIEW_VARIANTS.some((variant) => variant === value);
}

export function ErrorScreensPreviewPage() {
  const { t } = useTranslation();
  const { screenId } = useParams();

  if (screenId === 'x11') {
    return (
      <div className="error-screens-preview" data-testid="error-preview-x11">
        <div className="connection-status-banner-wrap">
          <Banner
            variant="accent"
            icon={Info}
            title={t('errors.pages.browserOfflineBanner.title')}
            description={t('errors.pages.browserOfflineBanner.lead')}
          />
          <ErrorCodeDetails compact code={ERROR_CODES.SERVICE_UNAVAILABLE} requestId="7f3a91c2deadbeef" />
        </div>
        <header className="error-screens-preview-header">
          <h1>{t('nav.documents')}</h1>
          <p className="muted">{t('errors.pages.connectionLost.documentsLead')}</p>
        </header>
        <div className="error-screens-preview-skeleton-card">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="error-screens-preview-skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (screenId === 'x4') {
    return (
      <div className="error-screens-preview" data-testid="error-preview-x4">
        <div className="connection-status-banner-wrap">
          <Banner
            variant="danger"
            icon={WifiOff}
            title={t('errors.pages.connectionLost.title')}
            description={t('errors.pages.connectionLost.lead')}
            action={
              <Button type="button" variant="secondary" onClick={() => undefined}>
                {t('errors.pages.connectionLost.action')}
              </Button>
            }
          />
          <ErrorCodeDetails compact code={ERROR_CODES.SERVICE_UNAVAILABLE} requestId="7f3a91c2deadbeef" />
        </div>
        <header className="error-screens-preview-header">
          <h1>{t('nav.documents')}</h1>
          <p className="muted">{t('errors.pages.connectionLost.documentsLead')}</p>
        </header>
        <div className="error-screens-preview-skeleton-card">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="error-screens-preview-skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (screenId === 'x2') {
    return (
      <div className="page route-error-page" data-testid="error-preview-x2">
        <RouteErrorScreen />
      </div>
    );
  }

  if (isPreviewVariant(screenId)) {
    return (
      <div className="page" data-testid={`error-preview-${screenId}`}>
        <HttpStatusErrorPage
          variant={screenId}
          requestId="7f3a91c2deadbeef"
          retryAfterSeconds={screenId === '429' || screenId === '502' || screenId === '503' ? 12 : 0}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <p>{t('errors.docs.previewMissing')}</p>
    </div>
  );
}
