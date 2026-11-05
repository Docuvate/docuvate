// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ConnectorAuthFieldDescriptorDto,
  ConnectorPluginCatalogEntryDto,
  ConnectorSourceScopeDto,
} from '@docuvate/contracts';
import { type FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { listFolders, listTags, previewConnectorSourceNodes, probeSftpFetchHostKey } from '../../lib/api';
import { connectorOAuthConfigured, connectorOAuthMissingEnvVars } from '../../lib/connectorOAuth';
import { connectorsOAuthSetupDocUrl } from '../../lib/connectorOAuthSetupDoc';
import { connectorPluginSupportsSourceSelection } from '../../lib/connectorSourceSelection';
import { validateHttpUrlInput } from '../../lib/httpUrlInput';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';
import { Select } from '../ui/Select';
import { type ConnectorSetupStep,ConnectorSetupStepper } from './ConnectorSetupStepper';
import { ConnectorSourceScopePicker } from './ConnectorSourceScopePicker';

interface ConnectorConnectDialogProps {
  open: boolean;
  plugin: ConnectorPluginCatalogEntryDto | null;
  busy?: boolean;
  viewerIsServerAdmin?: boolean;
  /** API/connect failure shown inside the dialog (not as a toast behind it). */
  submitError?: string | null;
  onSubmit: (payload: {
    displayName: string;
    credentials: Record<string, string>;
    sourceScope?: ConnectorSourceScopeDto;
  }) => void;
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
  submitError = null,
  onSubmit,
  onOAuthStart,
  onCancel,
}: ConnectorConnectDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [displayName, setDisplayName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [probeMessage, setProbeMessage] = useState<string | null>(null);
  const [probeBusy, setProbeBusy] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [step, setStep] = useState<ConnectorSetupStep>('access');
  const [sourceScope, setSourceScope] = useState<ConnectorSourceScopeDto>({ mode: 'all', paths: [] });
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fields = useMemo(() => plugin?.auth.fields ?? [], [plugin]);
  const isOAuth = plugin?.auth.strategy === 'oauth2';
  const hasSelectionStep = plugin != null && !isOAuth && connectorPluginSupportsSourceSelection(plugin.id);
  /** Credentials are reset in an effect, so the first render after a plugin switch still sees the previous map. */
  const credential = (key: string): string => credentials[key] ?? '';

  useEffect(() => {
    if (!plugin) {
      setDisplayName('');
      setCredentials({});
      setStep('access');
      setSourceScope({ mode: 'all', paths: [] });
      return;
    }
    setDisplayName(defaultDisplayName(plugin, t));
    const initial: Record<string, string> = {};
    for (const field of plugin.auth.fields) {
      initial[field.key] = '';
    }
    if (plugin.id === 'sftp_fetch') {
      initial.after_import = 'delete';
      initial.poll_interval_seconds = '60';
      initial.target_folder_id = '';
      initial.label_ids = '';
    }
    setCredentials(initial);
    setProbeMessage(null);
    setStep('access');
    setSourceScope({ mode: 'all', paths: [] });
    setStepError(null);
    setFieldErrors({});
  }, [plugin, t]);

  useEffect(() => {
    if (!open || plugin?.id !== 'sftp_fetch') return;
    void Promise.all([listFolders(), listTags()]).then(([folderRows, tagRows]) => {
      setFolders(folderRows);
      setTags(tagRows);
    });
  }, [open, plugin?.id]);

  async function handleProbeHostKey() {
    if (plugin?.id !== 'sftp_fetch') return;
    setProbeBusy(true);
    setProbeMessage(null);
    try {
      const result = await probeSftpFetchHostKey({
        host: credential('host'),
        port: Number(credential('port')) || 22,
        username: credential('username'),
        password: credential('password') || undefined,
        privateKey: credential('private_key') || undefined,
      });
      setProbeMessage(
        t('connectors.sftpProbeSuccess', { fingerprint: result.hostKeyFingerprintSha256 })
      );
    } catch {
      setProbeMessage(t('connectors.sftpProbeFailed'));
    } finally {
      setProbeBusy(false);
    }
  }

  function fieldLabel(field: ConnectorAuthFieldDescriptorDto) {
    return t(field.labelKey);
  }

  function urlInvalidMessage(pluginId: string): string {
    if (pluginId === 'paperless') {
      return t('connectors.plugins.paperless.errors.urlInvalid');
    }
    if (pluginId === 'home_assistant') {
      return t('connectors.plugins.homeAssistant.errors.urlInvalid');
    }
    return t('connectors.errors.urlInvalid');
  }

  function validateUrlFields(): boolean {
    if (!plugin) return false;
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== 'url') continue;
      const raw = credential(field.key);
      const result = validateHttpUrlInput(raw);
      if (!result.ok) {
        nextErrors[field.key] = urlInvalidMessage(plugin.id);
      }
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function advanceToSelection() {
    if (!plugin) return;
    setStepError(null);
    if (!validateUrlFields()) return;
    try {
      await previewConnectorSourceNodes(plugin.id, credentials, '');
      setStep('selection');
    } catch {
      setStepError(t('connectors.sources.loadFailed'));
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!plugin) return;
    if (plugin.auth.strategy === 'oauth2') {
      onOAuthStart?.({
        displayName: displayName.trim(),
        accountHint: credential('account_hint').trim() || undefined,
      });
      return;
    }
    if (!validateUrlFields()) return;
    if (hasSelectionStep && step === 'access') {
      void advanceToSelection();
      return;
    }
    onSubmit({
      displayName: displayName.trim(),
      credentials,
      sourceScope: hasSelectionStep ? sourceScope : undefined,
    });
  }

  const strategyHint = plugin != null ? t(`connectors.auth.strategy.${plugin.auth.strategy}`) : '';
  const oauthReady = plugin != null ? connectorOAuthConfigured(plugin) : true;
  const docUrl = connectorsOAuthSetupDocUrl();
  const missingVars = plugin != null ? connectorOAuthMissingEnvVars(plugin) : [];

  const rootSourceLabel =
    plugin?.id === 'amazon_s3'
      ? t('connectors.sources.rootBucket', {
          name: credential('bucket').trim().length > 0
            ? credential('bucket').trim()
            : t('connectors.sources.rootBucketFallback'),
        })
      : plugin?.id === 'sftp_fetch'
        ? t('connectors.sources.rootServer')
        : t('connectors.sources.rootMailbox');

  return (
    <Dialog
      open={open && plugin != null}
      busy={busy}
      onCancel={onCancel}
      aria-labelledby={titleId}
      className="connector-connect-dialog"
    >
      {plugin ? (
        <form noValidate onSubmit={handleSubmit}>
          <DialogHeader
            title={t('connectors.connectTitle', { name: t(plugin.labelKey) })}
            titleId={titleId}
            description={strategyHint}
          />
          <DialogBody>
            {hasSelectionStep ? <ConnectorSetupStepper step={step} /> : null}
            {stepError ? (
              <p className="error" role="alert">
                {stepError}
              </p>
            ) : null}
            {submitError ? (
              <p className="error" role="alert" data-testid="connector-connect-submit-error">
                {submitError}
              </p>
            ) : null}
            {step === 'access' ? (
              <>
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
                    <p className="muted connector-connect-oauth-block">
                      {t('connectors.connectDisabledOAuth')}
                    </p>
                  )
                ) : null}
                <label className="settings-field">
                  {t('connectors.displayName')}
                  <Input
                    value={displayName}
                    required
                    disabled={busy}
                    onChange={(e) => { setDisplayName(e.target.value); }}
                    aria-label={t('connectors.displayName')}
                  />
                </label>
                {fields
                  .filter(
                    (field) =>
                      plugin.id !== 'sftp_fetch' ||
                      ![
                        'after_import',
                        'poll_interval_seconds',
                        'target_folder_id',
                        'label_ids',
                      ].includes(field.key)
                  )
                  .map((field) => {
                    const fieldError = fieldErrors[field.key];
                    const inputType =
                      field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text';
                    return (
                      <div key={field.key} className="settings-field">
                        <label className="settings-field-label" htmlFor={`connector-field-${field.key}`}>
                          <span>{fieldLabel(field)}</span>
                          {field.required ? (
                            <span className="settings-field-required" aria-hidden="true">
                              {' '}
                              *
                            </span>
                          ) : null}
                        </label>
                        {field.type === 'password' ? (
                          <PasswordInput
                            id={`connector-field-${field.key}`}
                            value={credentials[field.key] ?? ''}
                            required={field.required}
                            disabled={busy}
                            autoComplete={field.secret ? 'off' : undefined}
                            placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                            onChange={(e) => {
                              setFieldErrors((prev) => {
                                if (!(field.key in prev)) return prev;
                                const next = { ...prev };
                                delete next[field.key];
                                return next;
                              });
                              setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }));
                            }}
                            aria-label={fieldLabel(field)}
                            aria-invalid={fieldError ? true : undefined}
                            aria-describedby={
                              fieldError
                                ? `connector-field-${field.key}-error`
                                : field.helpKey
                                  ? `connector-field-${field.key}-help`
                                  : undefined
                            }
                          />
                        ) : (
                          <Input
                            id={`connector-field-${field.key}`}
                            type={inputType}
                            value={credentials[field.key] ?? ''}
                            required={field.required}
                            disabled={busy}
                            autoComplete={field.secret ? 'off' : undefined}
                            placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                            onChange={(e) => {
                              setFieldErrors((prev) => {
                                if (!(field.key in prev)) return prev;
                                const next = { ...prev };
                                delete next[field.key];
                                return next;
                              });
                              setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }));
                            }}
                            aria-label={fieldLabel(field)}
                            aria-invalid={fieldError ? true : undefined}
                            aria-describedby={
                              fieldError
                                ? `connector-field-${field.key}-error`
                                : field.helpKey
                                  ? `connector-field-${field.key}-help`
                                  : undefined
                            }
                          />
                        )}
                        {fieldError ? (
                          <p
                            id={`connector-field-${field.key}-error`}
                            className="error"
                            role="alert"
                          >
                            {fieldError}
                          </p>
                        ) : field.helpKey ? (
                          <p
                            id={`connector-field-${field.key}-help`}
                            className="muted settings-hint"
                          >
                            {t(field.helpKey)}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                {plugin.id === 'sftp_fetch' ? (
                  <>
                    <label className="settings-field">
                      {t('connectors.auth.fields.afterImport')} *
                      <Select
                        value={credential('after_import')}
                        onChange={(value) => {
                          setCredentials((prev) => ({ ...prev, after_import: value }));
                        }}
                        options={[
                          { value: 'delete', label: t('connectors.plugins.sftpFetch.afterImportDelete') },
                          { value: 'move', label: t('connectors.plugins.sftpFetch.afterImportMove') },
                        ]}
                        aria-label={t('connectors.auth.fields.afterImport')}
                      />
                    </label>
                    <label className="settings-field">
                      {t('connectors.auth.fields.pollIntervalSeconds')} *
                      <Input
                        type="number"
                        min={60}
                        step={60}
                        required
                        disabled={busy}
                        value={credential('poll_interval_seconds')}
                        onChange={(e) => {
                          setCredentials((prev) => ({
                            ...prev,
                            poll_interval_seconds: e.target.value,
                          }));
                        }}
                        aria-label={t('connectors.auth.fields.pollIntervalSeconds')}
                      />
                    </label>
                    <label className="settings-field">
                      {t('connectors.auth.fields.targetFolderId')}
                      <Select
                        value={credential('target_folder_id')}
                        onChange={(value) => {
                          setCredentials((prev) => ({ ...prev, target_folder_id: value }));
                        }}
                        options={[
                          { value: '', label: t('sftpIngress.targetFolderInbox') },
                          ...folders.map((f) => ({ value: f.id, label: f.name })),
                        ]}
                        aria-label={t('connectors.auth.fields.targetFolderId')}
                      />
                    </label>
                    <label className="settings-field">
                      {t('connectors.auth.fields.labelIds')}
                      <select
                        className="input"
                        multiple
                        value={credential('label_ids').split(',').filter(Boolean)}
                        disabled={busy}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                          setCredentials((prev) => ({
                            ...prev,
                            label_ids: selected.join(','),
                          }));
                        }}
                        aria-label={t('connectors.auth.fields.labelIds')}
                      >
                        {tags.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                      <span className="muted settings-hint">
                        {t('connectors.plugins.sftpFetch.labelIdsHelp')}
                      </span>
                    </label>
                  </>
                ) : null}
                {plugin.id === 'sftp_fetch' ? (
                  <div className="connector-sftp-probe">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy || probeBusy}
                      onClick={() => void handleProbeHostKey()}
                    >
                      {probeBusy ? t('connectors.sftpProbePending') : t('connectors.sftpProbeCta')}
                    </Button>
                    {probeMessage ? <p className="muted settings-hint">{probeMessage}</p> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <ConnectorSourceScopePicker
                rootLabel={rootSourceLabel}
                scope={sourceScope}
                onScopeChange={setSourceScope}
                disabled={busy}
                loadNodes={(parentPath) =>
                  previewConnectorSourceNodes(plugin.id, credentials, parentPath)
                }
              />
            )}
          </DialogBody>
          <DialogFooter>
            {hasSelectionStep && step === 'selection' ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setStep('access');
                  setStepError(null);
                }}
              >
                {t('connectors.stepper.back')}
              </Button>
            ) : (
              <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={busy || (isOAuth && !oauthReady)}>
              {busy
                ? isOAuth
                  ? t('connectors.oauthPending')
                  : t('connectors.connectPending')
                : isOAuth
                  ? t('connectors.oauthConnectCta')
                  : hasSelectionStep && step === 'access'
                    ? t('connectors.stepper.continue')
                    : t('connectors.connectSubmit')}
            </Button>
          </DialogFooter>
        </form>
      ) : null}
    </Dialog>
  );
}
