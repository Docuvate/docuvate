// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES } from '@docuvate/contracts';
import { Info, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { newClientErrorRequestId } from '../../lib/errorCodes';
import {
  bindBrowserOnlineListeners,
  getServerReachabilityState,
  retryServerConnection,
  subscribeServerReachability,
} from '../../lib/serverReachability';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { ErrorCodeDetails } from './ErrorCodeDetails';

export function ConnectionStatusBanners() {
  const { t } = useTranslation();
  const [state, setState] = useState(getServerReachabilityState());

  useEffect(() => {
    const unbindBrowser = bindBrowserOnlineListeners();
    const unsubscribe = subscribeServerReachability((next) => {
      setState(next);
    });
    return () => {
      unsubscribe();
      unbindBrowser();
    };
  }, []);

  if (state.browserOffline) {
    return (
      <div className="connection-status-banner-wrap" data-testid="banner-offline-info">
        <Banner
          variant="accent"
          icon={Info}
          title={t('errors.pages.browserOfflineBanner.title')}
          description={t('errors.pages.browserOfflineBanner.lead')}
        />
        <ErrorCodeDetails
          compact
          code={ERROR_CODES.SERVICE_UNAVAILABLE}
          requestId={newClientErrorRequestId()}
          className="connection-status-banner-code"
        />
      </div>
    );
  }

  if (!state.serverUnreachable) {
    return null;
  }

  return (
    <div className="connection-status-banner-wrap" data-testid="banner-server-unreachable">
      <Banner
        variant="danger"
        icon={WifiOff}
        title={t('errors.pages.connectionLost.title')}
        description={t('errors.pages.connectionLost.lead')}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void retryServerConnection();
            }}
          >
            {t('errors.pages.connectionLost.action')}
          </Button>
        }
      />
      <ErrorCodeDetails
        compact
        code={ERROR_CODES.SERVICE_UNAVAILABLE}
        requestId={newClientErrorRequestId()}
        className="connection-status-banner-code"
      />
    </div>
  );
}
