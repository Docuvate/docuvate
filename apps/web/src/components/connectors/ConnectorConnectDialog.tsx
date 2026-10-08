import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ConnectorAuthFieldDescriptorDto,
  ConnectorPluginCatalogEntryDto,
} from '@docuvate/contracts';
import { connectorOAuthConfigured, connectorOAuthMissingEnvVars } from '../../lib/connectorOAuth';
import { connectorsOAuthSetupDocUrl } from '../../lib/connectorOAuthSetupDoc';
import { probeSftpFetchHostKey } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ConnectorConnectDialogProps {
  open: boolean;
  plugin: ConnectorPluginCatalogEntryDto | null;
  busy?: boolean;
  viewerIsServerAdmin?: boolean;
  onSubmit: (payload: { displayName: string; credentials: Record<string, string> }) => void;
  onOAuthStart?: (payload: { displayName: string; accountHint?: string }) => void;
  onCancel: () => void;
}

function defaultDisplayName(plugin: ConnectorPluginCatalogEntryDto, t: (key: string) => string) {
  return t(plugin.labelKey);
}

export function ConnectorConnectDialog({
  open,
  plugin,
  busy = false,
  viewerIsServerAdmin = false,
  onSubmit,
  onOAuthStart,
  onCancel,
}: ConnectorConnectDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [displayName, setDisplayName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [probeBusy, setProbeBusy] = useState(false);

  const fields = useMemo(
    () => plugin?.auth.fields ?? [],
    [plugin]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!plugin) {
      setDisplayName('');
      setCredentials({});
      return;
    }
    setDisplayName(defaultDisplayName(plugin, t));
    const initial: Record<string, string> = {};
    for (const field of plugin.auth.fields) {
      initial[field.key] = '';
    }
    setCredentials(initial);
    setProbeMessage(null);
  }, [plugin, t]);

  async function handleProbeHostKey() {
    if (!plugin || plugin.id !== 'sftp_fetch') return;
    setProbeBusy(true);
    setProbeMessage(null);
    try {
      const result = await probeSftpFetchHostKey({
        host: credentials['host'] ?? '',
        port: Number(credentials['port'] ?? 22) || 22,
        username: credentials['username'] ?? '',
        password: credentials['password'] || undefined,
        privateKey: credentials['private_key'] || undefined,
      });
      setCredentials((prev) => ({ ...prev, host_key_fingerprint: result.hostKeyFingerprintSha256 }));
      setProbeMessage(t('connectors.sftpProbeSuccess', { fingerprint: result.hostKeyFingerprintSha256 }));
    } catch {
      setProbeMessage(t('connectors.sftpProbeFailed'));
    } finally {
      setProbeBusy(false);
    }
  }

  function fieldLabel(field: ConnectorAuthFieldDescriptorDto) {
    return t(field.labelKey);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!plugin) return;
    if (plugin.auth.strategy === 'oauth2') {
      onOAuthStart?.({
        displayName: displayName.trim(),
        accountHint: credentials['account_hint']?.trim() || undefined,
      });
      return;
    }
    onSubmit({ displayName: displayName.trim(), credentials });
  }

  const strategyHint =
    plugin != null ? t(`connectors.auth.strategy.${plugin.auth.strategy}`) : '';
  const isOAuth = plugin?.auth.strategy === 'oauth2';
  const oauthReady = plugin != null ? connectorOAuthConfigured(plugin) : true;
  const docUrl = connectorsOAuthSetupDocUrl();
  const missingVars = plugin != null ? connectorOAuthMissingEnvVars(plugin) : [];

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog connector-connect-dialog"
      aria-labelledby="connector-connect-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      {plugin ? (
        <form onSubmit={handleSubmit}>
          <h2 id="connector-connect-title" className="confirm-dialog-title">
            {t('connectors.connectTitle', { name: t(plugin.labelKey) })}
          </h2>
          <p className="muted confirm-dialog-desc">{strategyHint}</p>
          {isOAuth && !oauthReady ? (
            viewerIsServerAdmin ? (
              <details className="connector-oauth-admin-details connector-connect-oauth-block">
                <summary>{t('connectors.oauthAdminDetailsToggle')}</summary>
                <div className="connector-oauth-admin-details-body">
                  <p>{t(`connectors.oauthUnavailableAdmin.${plugin.id}`)}</p>
                  <p>
                    <a href={docUrl} target="_blank" rel="noopener noreferrer">
                      {t('connectors.oauthSetupDocLink')}
                    </a>
                  </p>
                  {missingVars.length > 0 ? (
                    <div className="connector-oauth-env-scroll">
                      <code className="connector-oauth-env-list">{missingVars.join('\n')}</code>
                    </div>
                  ) : null}
                </div>
              </details>
            ) : (
              <p className="muted connector-connect-oauth-block">{t('connectors.connectDisabledOAuth')}</p>
            )
          ) : null}
          <label className="settings-field">
            {t('connectors.displayName')}
            <Input
              value={displayName}
              required
              disabled={busy}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-label={t('connectors.displayName')}
            />
          </label>
          {fields.map((field) => (
            <label key={field.key} className="settings-field">
              {fieldLabel(field)}
              {field.required ? ' *' : ''}
              <Input
                type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
                value={credentials[field.key] ?? ''}
                required={field.required}
                disabled={busy}
                autoComplete={field.secret ? 'off' : undefined}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                aria-label={fieldLabel(field)}
              />
              {field.helpKey ? <span className="muted settings-hint">{t(field.helpKey)}</span> : null}
            </label>
          ))}
          {plugin.id === 'sftp_fetch' ? (
            <div className="connector-sftp-probe">
              <Button type="button" variant="secondary" disabled={busy || probeBusy} onClick={() => void handleProbeHostKey()}>
                {probeBusy ? t('connectors.sftpProbePending') : t('connectors.sftpProbeCta')}
              </Button>
              {probeMessage ? <p className="muted settings-hint">{probeMessage}</p> : null}
            </div>
          ) : null}
          <div className="confirm-dialog-actions">
            <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={busy || (isOAuth && !oauthReady)}>
              {busy
                ? isOAuth
                  ? t('connectors.oauthPending')
                  : t('connectors.connectPending')
                : isOAuth
                  ? t('connectors.oauthConnectCta')
                  : t('connectors.connectSubmit')}
            </Button>
          </div>
        </form>
      ) : null}
    </dialog>
  );
}
