// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { toUserFacingError } from '../../lib/apiErrors';
import { newClientErrorRequestId } from '../../lib/errorCodes';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { ErrorScreenLayout } from './ErrorScreenLayout';

export function RouteErrorScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  const facing = useMemo(() => toUserFacingError(error, 'errors.pages.routeFailed.lead'), [error]);
  const requestId = useMemo(() => {
    if (isRouteErrorResponse(error) && isRecord(error.data) && typeof error.data.requestId === 'string') {
      return error.data.requestId;
    }
    return newClientErrorRequestId();
  }, [error]);

  const code =
    facing.code ??
    (isRouteErrorResponse(error) && typeof error.status === 'number' && error.status >= 500
      ? 'INTERNAL_ERROR'
      : 'DOC_LOAD_FAILED');

  const title = t('errors.pages.routeFailed.title');
  const description =
    facing.i18nKey === 'errors.pages.routeFailed.lead'
      ? t('errors.pages.routeFailed.lead')
      : t(facing.i18nKey, facing.params ?? {});

  return (
    <ErrorScreenLayout
      icon={AlertCircle}
      title={title}
      description={description}
      errorCode={code}
      requestId={requestId}
      actions={
        <>
          <Button type="button" variant="primary" onClick={() => { window.location.reload(); }}>
            <RefreshCw size={16} strokeWidth={2} aria-hidden />
            {t('errors.pages.retry')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => { navigate(routes.home); }}>
            {t('errors.pages.home')}
          </Button>
        </>
      }
    />
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
