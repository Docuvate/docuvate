// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserSettingsDto } from '@docuvate/contracts';
import { Lock, RefreshCw, Server, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { settingsChatStatusPresentation } from '../../lib/settingsChatStatus';
import { Banner } from '../ui/Banner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface GlobalChatNotReadyPanelProps {
  settings: UserSettingsDto | null;
  onRetryStatus: () => void;
  onOpenChatMode: () => void;
}

export function GlobalChatNotReadyPanel({
  settings,
  onRetryStatus,
  onOpenChatMode,
}: GlobalChatNotReadyPanelProps) {
  const { t } = useTranslation();
  const status = settingsChatStatusPresentation(t, settings);
  const reason = settings?.documentChatReadinessReason ?? null;
  const chatOff = settings?.customerChatProvider === 'off' || settings?.preferredChatProvider === 'off';

  return (
    <div className="global-chat-not-ready">
      <Banner
        variant="info"
        icon={RefreshCw}
        title={status.message}
        description={t('globalChat.notReadyBannerSecondary')}
        action={
          <Button type="button" variant="secondary" onClick={onRetryStatus}>
            {t('globalChat.notReadyCheckStatus')}
          </Button>
        }
      />
      <Card className="global-chat-not-ready-card">
        <h2 className="global-chat-not-ready-card-title">{t('globalChat.notReadyMoreStatesTitle')}</h2>
        <ul className="global-chat-not-ready-rows">
          <li className="global-chat-not-ready-row">
            <Server size={18} strokeWidth={1.75} aria-hidden="true" />
            <p>{t('globalChat.notReadyStateServer')}</p>
            <Link className="btn btn-secondary global-chat-not-ready-link" to={`${routes.settings}#settings-document-chat`}>
              {t('globalChat.notReadyOpenSettings')}
            </Link>
          </li>
          <li className="global-chat-not-ready-row">
            <WifiOff size={18} strokeWidth={1.75} aria-hidden="true" />
            <p>{t('globalChat.notReadyStateOffline')}</p>
            <Button type="button" variant="secondary" onClick={onRetryStatus}>
              {t('globalChat.notReadyRetry')}
            </Button>
          </li>
          <li className="global-chat-not-ready-row">
            <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
            <p>{t('globalChat.notReadyStateOff')}</p>
            <Button type="button" variant="secondary" onClick={onOpenChatMode}>
              {t('globalChat.notReadyChooseMode')}
            </Button>
          </li>
        </ul>
        {reason && !chatOff ? (
          <p className="muted global-chat-not-ready-reason">{status.message}</p>
        ) : null}
      </Card>
    </div>
  );
}
