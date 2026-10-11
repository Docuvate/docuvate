// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Button } from './ui/Button';

export function RouteErrorFallback() {
  const { t } = useTranslation();
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : t('errors.generic');

  return (
    <div className="page">
      <h1>{t('errors.generic')}</h1>
      <p className="error" role="alert">
        {message}
      </p>
      <Button type="button" variant="secondary" onClick={() => { window.location.assign('/'); }}>
        {t('nav.documents')}
      </Button>
    </div>
  );
}
