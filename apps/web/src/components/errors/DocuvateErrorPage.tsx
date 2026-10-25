// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { RefreshCw } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import type { ConnectivityFailureKind } from '../../lib/authConnectivity';
import { readAuthClientErrorShape } from '../../lib/authConnectivity';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { CollapsibleTechnicalDetails } from './CollapsibleTechnicalDetails';
import { ErrorCodeDetails } from './ErrorCodeDetails';
import { ErrorSceneIllustration, type ErrorSceneId } from './ErrorSceneIllustration';
import { ReconnectCountdownBar } from './ReconnectCountdownBar';
import { useApiHealthReconnect } from './useApiHealthReconnect';

export type DocuvateErrorPageVariant =
  | ConnectivityFailureKind
  | 'not-found'
  | 'unexpected'
  | 'server-error-page';

export interface DocuvateErrorPageProps {
  variant: DocuvateErrorPageVariant;
  sourceError?: unknown;
  httpStatus?: number;
  errorCode?: string;
  requestId?: string;
  enableAutoReconnect?: boolean;
  onRecovered?: () => void;
  actionsSlot?: React.ReactNode;
}

function sceneIdForVariant(variant: DocuvateErrorPageVariant): ErrorSceneId {
  switch (variant) {
    case 'browser-offline':
      return 'offline';
    case 'server-unreachable':
      return 'unreachable';
    case 'server-error':
    case 'server-error-page':
      return 'serverFault';
    case 'not-found':
      return 'notFound';
    case 'unexpected':
      return 'unexpected';
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function sceneCopyKey(variant: DocuvateErrorPageVariant): string {
  return sceneIdForVariant(variant);
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

  const { secondsUntilRetry, countdownTotalSeconds, isProbing, retryNow } = useApiHealthReconnect({
    enabled: reconnectEnabled,
    onRecovered,
  });

  const parsed = sourceError != null ? readAuthClientErrorShape(sourceError) : {};
  const technicalErrorType =
    parsed.message ??
    (sourceError instanceof Error ? sourceError.name : undefined) ??
    variant;
  const technicalStatus = httpStatus ?? parsed.status ?? undefined;

  const copyKey = sceneCopyKey(variant);
  const kicker = t(`errors.pages.scene.${copyKey}.kicker`, { defaultValue: '' });
  const title = t(`errors.pages.scene.${copyKey}.title`);
  const lead = t(`errors.pages.scene.${copyKey}.lead`);

  const scene = sceneIdForVariant(variant);
  const animating = reconnectEnabled && (isProbing || secondsUntilRetry > 0);

  const countdownSlot =
    reconnectEnabled && (secondsUntilRetry > 0 || isProbing || secondsUntilRetry === 0)
      ? (
        <ReconnectCountdownBar
          secondsLeft={secondsUntilRetry}
          totalSeconds={countdownTotalSeconds}
          isProbing={isProbing}
          probingLabel={t('errors.pages.unreachable.probing')}
          label={
            secondsUntilRetry > 0
              ? t('errors.pages.unreachable.reconnectCountdown', { seconds: secondsUntilRetry })
              : t('errors.pages.unreachable.ready')
          }
        />
      )
      : null;

  const defaultActions =
    variant === 'not-found'
      ? (
        <Link className="btn btn-primary" to={routes.documents}>
          {t('notFoundPage.documentsLink')}
        </Link>
      )
      : reconnectEnabled
        ? (
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
        )
        : (
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

  const showCodeBlock = Boolean(errorCode && requestId);

  return (
    <>
      <div
        className="error-scene-visual"
        data-testid={`docuvate-error-${variant}`}
      >
        <ErrorSceneIllustration scene={scene} animating={animating} />
      </div>
      <div className="error-scene-copy" role="alert" aria-live="assertive">
        {kicker ? <p className="error-scene-kicker">{kicker}</p> : null}
        <h1 className="error-scene-title">{title}</h1>
        <p className="error-scene-lead">{lead}</p>
        {countdownSlot}
        <div className="error-scene-actions">{actionsSlot ?? defaultActions}</div>
        <div className="error-scene-meta">
          <CollapsibleTechnicalDetails
            errorType={technicalErrorType}
            statusCode={technicalStatus}
            occurredAt={occurredAt}
          />
          {showCodeBlock && errorCode && requestId ? (
            <ErrorCodeDetails code={errorCode} requestId={requestId} compact />
          ) : null}
        </div>
      </div>
    </>
  );
}
