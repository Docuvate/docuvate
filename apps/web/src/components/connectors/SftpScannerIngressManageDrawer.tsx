// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto, SftpIngressAccountDto, SftpIngressEventDto } from '@docuvate/contracts';
import { type RefObject,useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsCallout } from '../settings/SettingsCallout';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import { SftpIngressManageDrawerShell } from './SftpIngressManageDrawerShell';

function lastReceivedAt(events: SftpIngressEventDto[]): string | null {
  const ok = events.filter((e) => e.status === 'processed' || e.status === 'received');
  if (!ok.length) return null;
  return ok.reduce(
    (latest, row) => (row.createdAt > latest ? row.createdAt : latest),
    ok[0].createdAt
  );
}

function authMethodLabel(account: SftpIngressAccountDto, t: (key: string) => string): string {
  if (account.hasSshPublicKey) return t('sftpIngress.badgeSshKey');
  return t('sftpIngress.badgePassword');
}

interface SftpScannerIngressManageDrawerProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
  accounts: SftpIngressAccountDto[];
  eventsByAccount: Record<string, SftpIngressEventDto[]>;
  folders: FolderDto[];
  endpointLine: string;
  fingerprint: string | null;
  serverReady: boolean;
  viewerIsServerAdmin: boolean;
  onCreate: () => void;
  onRevoke: (account: SftpIngressAccountDto) => void;
}

export function SftpScannerIngressManageDrawer({
  open,
  onClose,
  returnFocusRef,
  accounts,
  eventsByAccount,
  folders,
  endpointLine,
  fingerprint,
  serverReady,
  viewerIsServerAdmin,
  onCreate,
  onRevoke,
}: SftpScannerIngressManageDrawerProps) {
  const { t, i18n } = useTranslation();

  const formatReceivedTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(iso)),
    [i18n.language]
  );

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const aAt = lastReceivedAt(eventsByAccount[a.id] ?? []) ?? '';
        const bAt = lastReceivedAt(eventsByAccount[b.id] ?? []) ?? '';
        return bAt.localeCompare(aAt);
      }),
    [accounts, eventsByAccount]
  );

  const renderFingerprintValue = useCallback(() => {
    if (fingerprint) {
      return (
        <div className="connector-sftp-kv-value">
          <code>{fingerprint}</code>
          <CopyButton value={fingerprint} />
        </div>
      );
    }
    return (
      <SettingsCallout variant="info">
        <p className="connector-sftp-fingerprint-lead">{t('sftpIngress.fingerprintPurpose')}</p>
        <p className="muted connector-sftp-fingerprint-status">
          {!serverReady
            ? t('sftpIngress.serverLoading')
            : t('sftpIngress.fingerprintPendingStatus')}
        </p>
      </SettingsCallout>
    );
  }, [fingerprint, serverReady, t]);

  return (
    <SftpIngressManageDrawerShell
      open={open}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t('sftpIngress.manageDrawerTitle')}
    >
      <div className="connector-sftp-manage-drawer-body">
        {viewerIsServerAdmin ? (
          <div className="connector-sftp-kv-grid connector-sftp-kv-grid--compact">
            <div className="connector-sftp-kv-row">
              <span className="connector-sftp-kv-label">{t('sftpIngress.serverAddress')}</span>
              <div className="connector-sftp-kv-value">
                <code>{endpointLine}</code>
                <CopyButton value={endpointLine} />
              </div>
            </div>
            <div className="connector-sftp-kv-row">
              <span className="connector-sftp-kv-label">{t('sftpIngress.fingerprint')}</span>
              {renderFingerprintValue()}
            </div>
          </div>
        ) : null}

        <ul className="connector-sftp-access-list">
          {sortedAccounts.map((account) => {
            const events = eventsByAccount[account.id] ?? [];
            const received = lastReceivedAt(events);
            const folderName =
              folders.find((f) => f.id === account.folderId)?.name ??
              t('sftpIngress.targetFolderInbox');
            return (
              <li key={account.id} className="connector-sftp-access-row">
                <div className="connector-sftp-access-main">
                  <div className="connector-sftp-access-title">
                    <strong>{account.displayName}</strong>
                    <span className="connector-capability-badge">
                      {authMethodLabel(account, t)}
                    </span>
                  </div>
                  <dl className="connector-sftp-access-meta">
                    <div>
                      <dt>{t('sftpIngress.lastReceivedLabel')}</dt>
                      <dd>
                        {received
                          ? formatReceivedTime(received)
                          : t('sftpIngress.lastReceivedNever')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('sftpIngress.targetFolderLabel')}</dt>
                      <dd>{folderName}</dd>
                    </div>
                  </dl>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="connector-sftp-revoke-btn"
                  onClick={() => { onRevoke(account); }}
                >
                  {t('sftpIngress.revokeCta')}
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="connector-sftp-manage-actions">
          <Button type="button" onClick={onCreate}>
            {t('sftpIngress.createCta')}
          </Button>
        </div>
      </div>
    </SftpIngressManageDrawerShell>
  );
}
