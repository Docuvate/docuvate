import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  SftpIngressAccountDto,
  SftpIngressEventDto,
  SftpIngressServerInfoDto,
} from '@docuvate/contracts';
import {
  createSftpIngressAccount,
  getSftpIngressServer,
  listFolders,
  listSftpIngressAccounts,
  listSftpIngressEvents,
  revokeSftpIngressAccount,
} from '../../lib/api';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ConnectorPluginIcon } from './ConnectorPluginIcon';
import { SftpIngressSetupDialog } from './SftpIngressSetupDialog';
import { SftpScannerIngressManageDrawer } from './SftpScannerIngressManageDrawer';

function lastReceivedAt(events: SftpIngressEventDto[]): string | null {
  const ok = events.filter((e) => e.status === 'processed' || e.status === 'received');
  if (!ok.length) return null;
  return ok.reduce((latest, row) => (row.createdAt > latest ? row.createdAt : latest), ok[0]!.createdAt);
}

export function SftpScannerIngressSection({ viewerIsServerAdmin = false }: { viewerIsServerAdmin?: boolean }) {
  const { t, i18n } = useTranslation();
  const manageButtonRef = useRef<HTMLButtonElement>(null);
  const [server, setServer] = useState<SftpIngressServerInfoDto | null>(null);
  const [serverReady, setServerReady] = useState(false);
  const [accounts, setAccounts] = useState<SftpIngressAccountDto[]>([]);
  const [eventsByAccount, setEventsByAccount] = useState<Record<string, SftpIngressEventDto[]>>({});
  const [folders, setFolders] = useState<Awaited<ReturnType<typeof listFolders>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SftpIngressAccountDto | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);

  const reload = useCallback(async () => {
    setServerReady(false);
    setError(null);
    try {
      const [serverInfo, accountRows, folderRows] = await Promise.all([
        getSftpIngressServer(),
        listSftpIngressAccounts(),
        listFolders(),
      ]);
      setServer(serverInfo);
      setAccounts(accountRows);
      setFolders(folderRows);
      const eventEntries = await Promise.all(
        accountRows.map(async (account) => {
          const events = await listSftpIngressEvents(account.id, 12);
          return [account.id, events] as const;
        })
      );
      setEventsByAccount(Object.fromEntries(eventEntries));
    } catch {
      setError(t('sftpIngress.loadFailed'));
    } finally {
      setServerReady(true);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeCount = accounts.length;
  const cardClass = useMemo(
    () =>
      activeCount > 0
        ? 'connector-catalog-card connector-catalog-card--connected connector-sftp-card connector-sftp-card--compact'
        : 'connector-catalog-card connector-sftp-card connector-sftp-card--compact',
    [activeCount]
  );

  const latestReceived = useMemo(() => {
    const stamps = accounts
      .map((a) => lastReceivedAt(eventsByAccount[a.id] ?? []))
      .filter((v): v is string => Boolean(v));
    if (!stamps.length) return null;
    return stamps.reduce((a, b) => (a > b ? a : b));
  }, [accounts, eventsByAccount]);

  async function handleSubmit(payload: {
    displayName: string;
    folderId: string | null;
    authMode: 'password' | 'sshKey';
    sshPublicKey: string | null;
  }) {
    setCreateBusy(true);
    setError(null);
    try {
      return await createSftpIngressAccount({
        displayName: payload.displayName,
        folderId: payload.folderId,
        sshPublicKey: payload.authMode === 'sshKey' ? payload.sshPublicKey : null,
        passwordPlain: payload.authMode === 'sshKey' ? null : undefined,
      });
    } catch {
      setError(t('sftpIngress.createFailed'));
      throw new Error('create failed');
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevokeBusy(true);
    try {
      await revokeSftpIngressAccount(revokeTarget.id);
      setRevokeTarget(null);
      await reload();
    } catch {
      setError(t('sftpIngress.revokeFailed'));
    } finally {
      setRevokeBusy(false);
    }
  }

  const endpointLine = `${server?.host ?? '—'}:${server?.port ?? 2222}`;
  const fingerprint = server?.hostKeyFingerprintSha256 ?? null;

  const formatReceivedTime = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));

  const summaryLine =
    activeCount === 0
      ? t('sftpIngress.cardSummaryNone')
      : latestReceived
        ? t('sftpIngress.cardSummaryLastReceived', { time: formatReceivedTime(latestReceived) })
        : t('sftpIngress.cardSummaryNoActivity');

  return (
    <>
      <article className={cardClass} aria-labelledby="sftp-ingress-heading">
        <div className="connector-catalog-card-body">
          <div className="connector-catalog-card-top">
            <ConnectorPluginIcon pluginId="sftp_scanner" />
            <div className="connector-catalog-heading">
              <div className="connector-catalog-title-row">
                <h3 id="sftp-ingress-heading">{t('sftpIngress.title')}</h3>
                {activeCount > 0 ? (
                  <span className="connector-sftp-active-badge">
                    {t('sftpIngress.activeBadge', { count: activeCount })}
                  </span>
                ) : null}
              </div>
              <p className="connector-catalog-category">{t('connectors.categories.scannerSftp.label')}</p>
              <p className="muted connector-catalog-description">{summaryLine}</p>
            </div>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="connector-sftp-card-endpoint">
            <span className="connector-sftp-kv-label">{t('sftpIngress.serverAddress')}</span>
            <div className="connector-sftp-kv-value">
              <code>{endpointLine}</code>
              <CopyButton value={endpointLine} className="copy-btn-compact" />
            </div>
          </div>
        </div>
        <footer className="connector-catalog-card-footer connector-catalog-card-footer--actions-only">
          <div className="connector-catalog-actions">
            <Button
              ref={manageButtonRef}
              type="button"
              variant="secondary"
              onClick={() => setManageOpen(true)}
            >
              {t('sftpIngress.manageCta')}
            </Button>
          </div>
        </footer>
      </article>

      <SftpScannerIngressManageDrawer
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        returnFocusRef={manageButtonRef}
        accounts={accounts}
        eventsByAccount={eventsByAccount}
        folders={folders}
        endpointLine={endpointLine}
        fingerprint={fingerprint}
        serverReady={serverReady}
        viewerIsServerAdmin={viewerIsServerAdmin}
        onCreate={() => {
          setManageOpen(false);
          setSetupOpen(true);
        }}
        onRevoke={(account) => setRevokeTarget(account)}
      />

      <SftpIngressSetupDialog
        open={setupOpen}
        busy={createBusy}
        server={server}
        serverReady={serverReady}
        folders={folders}
        onCancel={() => setSetupOpen(false)}
        onComplete={() => void reload()}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title={t('sftpIngress.revokeConfirmTitle')}
        description={t('sftpIngress.revokeConfirmDescription', { name: revokeTarget?.displayName ?? '' })}
        confirmLabel={revokeBusy ? t('sftpIngress.revokePending') : t('sftpIngress.revokeCta')}
        busy={revokeBusy}
        tone="danger"
        onConfirm={() => void handleRevoke()}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
}
