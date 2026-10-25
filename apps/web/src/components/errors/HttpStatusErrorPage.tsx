// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES } from '@docuvate/contracts';
import {
  AlertCircle,
  Clock,
  Lock,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { newClientErrorRequestId } from '../../lib/errorCodes';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { DocuvateErrorPage } from './DocuvateErrorPage';
import { ErrorScreenLayout } from './ErrorScreenLayout';
import { FullPageErrorShell } from './FullPageErrorShell';

export type HttpErrorScreenVariant =
  | '401'
  | '403'
  | '500'
  | '502'
  | '503'
  | '429'
  | 'offline'
  | 'preview-x2';

export interface HttpStatusErrorPageProps {
  variant: HttpErrorScreenVariant;
  errorCode?: string;
  requestId?: string;
  retryAfterSeconds?: number;
  missingPermissionLabel?: string;
}

export function HttpStatusErrorPage({
  variant,
  errorCode,
  requestId,
  retryAfterSeconds = 0,
  missingPermissionLabel,
}: HttpStatusErrorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds);
  const resolvedRequestId = requestId ?? newClientErrorRequestId();

  useEffect(() => {
    setSecondsLeft(retryAfterSeconds);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => { window.clearInterval(timer); };
  }, [secondsLeft]);

  const config = useMemo(() => {
    switch (variant) {
      case '401':
        return {
          icon: Lock,
          title: t('errors.pages.sessionExpired.title'),
          description: t('errors.pages.sessionExpired.lead'),
          code: errorCode ?? ERROR_CODES.AUTH_SESSION_EXPIRED,
          actions: (
            <Button type="button" variant="primary" onClick={() => { navigate(`${routes.login}?reason=session_expired`); }}>
              {t('errors.pages.sessionExpired.action')}
            </Button>
          ),
          status: null,
        };
      case '403':
        return {
          icon: ShieldAlert,
          title: t('errors.pages.forbidden.title'),
          description: t('errors.pages.forbidden.lead', {
            permission: missingPermissionLabel ?? t('errors.pages.forbidden.permissionFallback'),
          }),
          code: errorCode ?? ERROR_CODES.ACCESS_FORBIDDEN,
          actions: (
            <Button type="button" variant="secondary" onClick={() => { navigate(routes.home); }}>
              {t('errors.pages.home')}
            </Button>
          ),
          status: null,
        };
      case '500':
        return {
          icon: ServerCrash,
          title: t('errors.pages.internal.title'),
          description: t('errors.pages.internal.lead'),
          code: errorCode ?? ERROR_CODES.INTERNAL_ERROR,
          actions: (
            <>
              <Button type="button" variant="primary" onClick={() => { window.location.reload(); }}>
                <RefreshCw size={16} strokeWidth={2} aria-hidden />
                {t('errors.pages.retry')}
              </Button>
              <a className="btn btn-secondary" href="mailto:hello@docuvate.de?subject=Docuvate%20Fehler">
                {t('errors.pages.internal.report')}
              </a>
            </>
          ),
          status: null,
        };
      case '502':
      case '503':
        return {
          icon: ServerCrash,
          title: '',
          description: '',
          code: errorCode ?? ERROR_CODES.SERVICE_UNAVAILABLE,
          actions: null,
          status: null,
        };
      case '429':
        return {
          icon: Clock,
          title: t('errors.pages.rateLimit.title'),
          description: t('errors.pages.rateLimit.lead'),
          code: errorCode ?? ERROR_CODES.RATE_LIMIT_EXCEEDED,
          actions: (
            <Button
              type="button"
              variant="primary"
              disabled={secondsLeft > 0}
              onClick={() => { window.location.reload(); }}
            >
              {t('errors.pages.retry')}
            </Button>
          ),
          status:
            secondsLeft > 0 ? (
              <p className="ds-error-screen-status">{t('errors.pages.rateLimit.countdown', { seconds: secondsLeft })}</p>
            ) : null,
        };
      case 'offline':
        return {
          icon: WifiOff,
          title: t('errors.pages.browserOffline.title'),
          description: t('errors.pages.browserOffline.lead'),
          code: errorCode ?? ERROR_CODES.SERVICE_UNAVAILABLE,
          actions: (
            <Button type="button" variant="secondary" onClick={() => { navigate(routes.home); }}>
              {t('errors.pages.home')}
            </Button>
          ),
          status: null,
        };
      case 'preview-x2':
        return {
          icon: AlertCircle,
          title: t('errors.pages.routeFailed.title'),
          description: t('errors.pages.routeFailed.lead'),
          code: errorCode ?? ERROR_CODES.DOC_LOAD_FAILED,
          actions: (
            <>
              <Button type="button" variant="primary" onClick={() => { window.location.reload(); }}>
                <RefreshCw size={16} strokeWidth={2} aria-hidden />
                {t('errors.pages.retry')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { navigate(routes.home); }}>
                {t('errors.pages.home')}
              </Button>
            </>
          ),
          status: null,
        };
      default: {
        const exhaustive: never = variant;
        return exhaustive;
      }
    }
  }, [errorCode, missingPermissionLabel, navigate, secondsLeft, t, variant]);

  if (variant === '502' || variant === '503') {
    return (
      <FullPageErrorShell testId={`http-error-${variant}`}>
        <DocuvateErrorPage
          variant="server-error-page"
          errorCode={errorCode ?? ERROR_CODES.SERVICE_UNAVAILABLE}
          requestId={resolvedRequestId}
          httpStatus={variant === '502' ? 502 : 503}
          enableAutoReconnect
          onRecovered={() => {
            window.location.reload();
          }}
        />
      </FullPageErrorShell>
    );
  }

  return (
    <ErrorScreenLayout
      icon={config.icon}
      title={config.title}
      description={config.description}
      statusSlot={config.status}
      actions={config.actions}
      errorCode={config.code}
      requestId={resolvedRequestId}
    />
  );
}
