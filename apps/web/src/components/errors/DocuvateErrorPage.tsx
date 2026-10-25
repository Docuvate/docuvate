// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  FileQuestion,
  RefreshCw,
  ServerCrash,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import type { ConnectivityFailureKind } from '../../lib/authConnectivity';
import { readAuthClientErrorShape } from '../../lib/authConnectivity';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { CollapsibleTechnicalDetails } from './CollapsibleTechnicalDetails';
import { ConnectivityIllustration } from './ConnectivityIllustration';
import { ErrorScreenLayout } from './ErrorScreenLayout';
import { useApiHealthReconnect } from './useApiHealthReconnect';

export type DocuvateErrorPageVariant =
  | ConnectivityFailureKind
  | 'not-found'
  | 'unexpected'
  | 'server-error-page';

export interface DocuvateErrorPageProps {
  variant: DocuvateErrorPageVariant;
  /** Source error for technical details (boot/session failures). */
  sourceError?: unknown;
  httpStatus?: number;
  errorCode?: string;
  requestId?: string;
  enableAutoReconnect?: boolean;
  onRecovered?: () => void;
  actionsSlot?: React.ReactNode;
}

function variantIcon(variant: DocuvateErrorPageVariant): LucideIcon {
  switch (variant) {
    case 'browser-offline':
      return WifiOff;
    case 'server-unreachable':
      return WifiOff;
    case 'server-error':
    case 'server-error-page':
      return ServerCrash;
    case 'not-found':
      return FileQuestion;
    case 'unexpected':
      return AlertCircle;
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function illustrationKind(variant: DocuvateErrorPageVariant): ConnectivityFailureKind | 'generic' {
  if (variant === 'browser-offline') {
    return 'browser-offline';
  }
  if (variant === 'server-unreachable') {
    return 'server-unreachable';
  }
  if (variant === 'server-error' || variant === 'server-error-page') {
    return 'server-error';
  }
  return 'generic';
}

export function DocuvateErrorPage({
  variant,
  sourceError,
  httpStatus,
  errorCode,
  requestId,
  enableAutoReconnect = false,
  onRecovered,
  actionsSlot,
}: DocuvateErrorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const occurredAt = useMemo(() => new Date(), []);

  const reconnectEnabled =
    enableAutoReconnect &&
    (variant === 'server-unreachable' || variant === 'server-error' || variant === 'server-error-page');

  const { secondsUntilRetry, isProbing, retryNow } = useApiHealthReconnect({
    enabled: reconnectEnabled,
    onRecovered,
  });

  useEffect(() => {
    retryButtonRef.current?.focus();
  }, []);

  const parsed = sourceError != null ? readAuthClientErrorShape(sourceError) : {};
  const technicalErrorType =
    parsed.message ??
    (sourceError instanceof Error ? sourceError.name : undefined) ??
    variant;
  const technicalStatus = httpStatus ?? parsed.status ?? undefined;

  const title = useMemo(() => {
    switch (variant) {
      case 'browser-offline':
        return t('errors.pages.browserOffline.fullTitle');
      case 'server-unreachable':
        return t('errors.pages.unreachable.title');
      case 'server-error':
      case 'server-error-page':
        return t('errors.pages.serverFault.title');
      case 'not-found':
        return t('notFoundPage.title');
      case 'unexpected':
        return t('errors.pages.routeFailed.title');
      default: {
        const exhaustive: never = variant;
        return exhaustive;
      }
    }
  }, [t, variant]);

  const description = useMemo(() => {
    switch (variant) {
      case 'browser-offline':
        return t('errors.pages.browserOffline.fullLead');
      case 'server-unreachable':
        return t('errors.pages.unreachable.lead');
      case 'server-error':
      case 'server-error-page':
        return t('errors.pages.serverFault.lead');
      case 'not-found':
        return t('notFoundPage.lead');
      case 'unexpected':
        return t('errors.pages.routeFailed.lead');
      default: {
        const exhaustive: never = variant;
        return exhaustive;
      }
    }
  }, [t, variant]);

  const statusSlot = useMemo(() => {
    if (reconnectEnabled) {
      if (isProbing) {
        return <p className="ds-error-screen-status">{t('errors.pages.unreachable.probing')}</p>;
      }
      if (secondsUntilRetry > 0) {
        return (
          <p className="ds-error-screen-status" aria-live="polite">
            {t('errors.pages.unreachable.reconnectCountdown', { seconds: secondsUntilRetry })}
          </p>
        );
      }
      return (
        <p className="ds-error-screen-status" aria-live="polite">
          {t('errors.pages.unreachable.ready')}
        </p>
      );
    }
    return null;
  }, [isProbing, reconnectEnabled, secondsUntilRetry, t]);

  const defaultActions = useMemo(() => {
    if (variant === 'not-found') {
      return (
        <Link className="btn btn-primary" to={routes.documents}>
          {t('notFoundPage.documentsLink')}
        </Link>
      );
    }
    if (reconnectEnabled) {
      return (
        <Button
          ref={retryButtonRef}
          type="button"
          variant="primary"
          disabled={isProbing}
          onClick={retryNow}
        >
          <RefreshCw size={16} strokeWidth={2} aria-hidden />
          {t('errors.pages.unreachable.retryNow')}
        </Button>
      );
    }
    return (
      <>
        <Button
          ref={retryButtonRef}
          type="button"
          variant="primary"
          onClick={() => {
            window.location.reload();
          }}
        >
          <RefreshCw size={16} strokeWidth={2} aria-hidden />
          {t('errors.pages.retry')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => { navigate(routes.home); }}>
          {t('errors.pages.home')}
        </Button>
      </>
    );
  }, [isProbing, navigate, reconnectEnabled, retryNow, t, variant]);

  const Icon = variantIcon(variant);

  return (
    <div
      className="docuvate-error-page"
      role="alert"
      aria-live="assertive"
      data-testid={`docuvate-error-${variant}`}
    >
      <ConnectivityIllustration kind={illustrationKind(variant)} />
      <ErrorScreenLayout
        icon={Icon}
        title={title}
        description={description}
        statusSlot={statusSlot}
        actions={actionsSlot ?? defaultActions}
        errorCode={errorCode}
        requestId={requestId}
      />
      <CollapsibleTechnicalDetails
        errorType={technicalErrorType}
        statusCode={technicalStatus}
        occurredAt={occurredAt}
      />
    </div>
  );
}
