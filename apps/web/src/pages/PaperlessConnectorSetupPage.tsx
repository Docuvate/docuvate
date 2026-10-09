import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type {
  PaperlessImportDryRunSummaryDto,
  PaperlessImportRunDto,
  PaperlessImportRunErrorDto,
  PaperlessInstallationDto,
} from '@docuvate/contracts';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import { formatConnectorError } from '../lib/connectorErrors';
import { formatUserFacingError } from '../lib/apiErrors';
import {
  getLatestPaperlessImportRun,
  getPaperlessImportRun,
  getPaperlessInstallation,
  listConnectorInstallations,
  paperlessImportDryRun,
  startPaperlessImport,
  testPaperlessInstallationConnection,
  updatePaperlessInstallation,
} from '../lib/api';
import { routes } from '../lib/routes';

type FormState = {
  displayName: string;
  baseUrl: string;
  apiToken: string;
  username: string;
  password: string;
  keepOcrText: boolean;
  rerunOcr: boolean;
  includeArchivedPdf: boolean;
};

type StoredFlags = {
  hasStoredApiToken: boolean;
  hasStoredUsername: boolean;
  hasStoredPassword: boolean;
};

const emptyForm: FormState = {
  displayName: '',
  baseUrl: '',
  apiToken: '',
  username: '',
  password: '',
  keepOcrText: true,
  rerunOcr: false,
  includeArchivedPdf: false,
};

function buildCredentialsPatch(form: FormState): Record<string, string> | undefined {
  const patch: Record<string, string> = {};
  if (form.baseUrl.trim()) {
    patch.base_url = form.baseUrl.trim();
  }
  if (form.apiToken.trim()) {
    patch.api_token = form.apiToken.trim();
  }
  if (form.username.trim()) {
    patch.username = form.username.trim();
  }
  if (form.password.trim()) {
    patch.password = form.password.trim();
  }
  return Object.keys(patch).length > 0 ? patch : undefined;
}

function formsEqual(a: FormState, b: FormState): boolean {
  return (
    a.displayName === b.displayName &&
    a.baseUrl === b.baseUrl &&
    a.apiToken === b.apiToken &&
    a.username === b.username &&
    a.password === b.password &&
    a.keepOcrText === b.keepOcrText &&
    a.rerunOcr === b.rerunOcr &&
    a.includeArchivedPdf === b.includeArchivedPdf
  );
}

export function PaperlessConnectorSetupPage() {
  const { installationId = '' } = useParams();
  const { t, i18n } = useTranslation();
  const [installationMeta, setInstallationMeta] = useState<PaperlessInstallationDto | null>(null);
  const [storedFlags, setStoredFlags] = useState<StoredFlags>({
    hasStoredApiToken: false,
    hasStoredUsername: false,
    hasStoredPassword: false,
  });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [savedForm, setSavedForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [dryRun, setDryRun] = useState<PaperlessImportDryRunSummaryDto | null>(null);
  const [dryRunBusy, setDryRunBusy] = useState(false);
  const [run, setRun] = useState<PaperlessImportRunDto | null>(null);
  const [errors, setErrors] = useState<PaperlessImportRunErrorDto[]>([]);
  const [importBusy, setImportBusy] = useState(false);

  useEffect(() => {
    void i18n.changeLanguage('de');
  }, [i18n]);

  const dirty = useMemo(() => !formsEqual(form, savedForm), [form, savedForm]);
  const importLocked = run?.status === 'pending' || run?.status === 'running';

  const load = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const installations = await listConnectorInstallations();
      const row = installations.find((item) => item.id === installationId) ?? null;
      if (!row || row.pluginId !== 'paperless') {
        setInstallationMeta(null);
        return;
      }
      const settings = await getPaperlessInstallation(installationId);
      setInstallationMeta(settings);
      setStoredFlags({
        hasStoredApiToken: settings.hasStoredApiToken,
        hasStoredUsername: settings.hasStoredUsername,
        hasStoredPassword: settings.hasStoredPassword,
      });
      const next: FormState = {
        ...emptyForm,
        displayName: settings.displayName,
        baseUrl: settings.baseUrl,
        keepOcrText: settings.keepOcrText,
        rerunOcr: settings.rerunOcr,
        includeArchivedPdf: settings.includeArchivedPdf,
      };
      setForm(next);
      setSavedForm(next);
      try {
        const latest = await getLatestPaperlessImportRun(installationId);
        setRun(latest.run);
        setErrors(latest.errors);
      } catch {
        setRun(null);
        setErrors([]);
      }
    } catch (err) {
      setSaveError(formatUserFacingError(err, 'connectors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!run || run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      return undefined;
    }
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const payload = await getPaperlessImportRun(installationId, run.id);
          setRun(payload.run);
          setErrors(payload.errors);
        } catch {
          // ignore polling errors
        }
      })();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [installationId, run]);

  async function handleSave() {
    if (!installationMeta) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updatePaperlessInstallation(installationId, {
        displayName: form.displayName.trim(),
        credentials: buildCredentialsPatch(form),
        keepOcrText: form.keepOcrText,
        rerunOcr: form.rerunOcr,
        includeArchivedPdf: form.includeArchivedPdf,
      });
      const refreshed = await getPaperlessInstallation(installationId);
      setInstallationMeta(refreshed);
      setStoredFlags({
        hasStoredApiToken: refreshed.hasStoredApiToken,
        hasStoredUsername: refreshed.hasStoredUsername,
        hasStoredPassword: refreshed.hasStoredPassword,
      });
      const nextSaved: FormState = {
        ...form,
        displayName: refreshed.displayName,
        baseUrl: refreshed.baseUrl,
        apiToken: '',
        username: '',
        password: '',
        keepOcrText: refreshed.keepOcrText,
        rerunOcr: refreshed.rerunOcr,
        includeArchivedPdf: refreshed.includeArchivedPdf,
      };
      setForm(nextSaved);
      setSavedForm(nextSaved);
      setActionMessage(t('connectors.plugins.paperless.saveSuccess'));
    } catch (err) {
      setSaveError(formatConnectorError(err, 'connectors.connectFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTestBusy(true);
    setActionMessage(null);
    try {
      const result = await testPaperlessInstallationConnection(
        installationId,
        buildCredentialsPatch(form) ?? {}
      );
      setActionMessage(t('connectors.plugins.paperless.testSuccess', { version: result.apiVersion }));
    } catch (err) {
      setActionMessage(formatConnectorError(err, 'connectors.plugins.paperless.errors.unreachable'));
    } finally {
      setTestBusy(false);
    }
  }

  async function handleDryRun() {
    setDryRunBusy(true);
    setActionMessage(null);
    try {
      const { summary } = await paperlessImportDryRun(installationId);
      setDryRun(summary);
      setActionMessage(
        t('connectors.plugins.paperless.dryRunSuccess', { count: summary.documentCount })
      );
    } catch (err) {
      setActionMessage(formatConnectorError(err, 'connectors.plugins.paperless.dryRunFailed'));
    } finally {
      setDryRunBusy(false);
    }
  }

  async function handleStartImport() {
    setImportBusy(true);
    setActionMessage(null);
    try {
      const { run: started } = await startPaperlessImport(installationId);
      setRun(started);
      setErrors([]);
      setActionMessage(t('connectors.plugins.paperless.importStarted'));
    } catch (err) {
      setActionMessage(formatConnectorError(err, 'connectors.plugins.paperless.importFailed'));
    } finally {
      setImportBusy(false);
    }
  }

  if (!loading && !installationMeta) {
    return (
      <SettingsSectionLayout sectionTitle={t('connectors.plugins.paperless.setupTitle')}>
        <p className="settings-status-line">{t('connectors.plugins.paperless.setupMissing')}</p>
        <Link className="settings-card-link-btn" to={routes.settingsConnectors}>
          {t('connectors.title')}
        </Link>
      </SettingsSectionLayout>
    );
  }

  const secretPlaceholder = t('connectors.plugins.paperless.storedSecret');

  return (
    <SettingsSectionLayout
      sectionTitle={t('connectors.plugins.paperless.setupTitle')}
      sectionLead={t('connectors.plugins.paperless.setupLead')}
    >
      <PageFormSaveKit
        dirty={dirty}
        saving={saving}
        error={saveError}
        onSave={() => void handleSave()}
        onDiscard={() => setForm(savedForm)}
      />

      {loading ? (
        <p className="settings-status-line" aria-busy="true">{t('connectors.loading')}</p>
      ) : null}

      {!loading && installationMeta ? (
        <div className="paperless-connector-setup">
          <section className="settings-section-card settings-section-card--compact">
            <div className="settings-section-body stack gap-md">
              <h2 className="settings-subheading">{t('connectors.plugins.paperless.connectionTitle')}</h2>
              <label className="settings-field">
                <span>{t('connectors.plugins.paperless.displayName')}</span>
                <Input
                  className="paperless-control"
                  value={form.displayName}
                  onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>{t('connectors.auth.fields.baseUrl')}</span>
                <Input
                  className="paperless-control"
                  type="url"
                  value={form.baseUrl}
                  placeholder={t('connectors.plugins.paperless.baseUrlPlaceholder')}
                  onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))}
                />
              </label>
              <label className="settings-field">
                <span>{t('connectors.auth.fields.apiToken')}</span>
                <Input
                  className="paperless-control"
                  type="password"
                  value={form.apiToken}
                  placeholder={
                    storedFlags.hasStoredApiToken && !form.apiToken
                      ? secretPlaceholder
                      : t('connectors.plugins.paperless.apiTokenHelp')
                  }
                  onChange={(event) => setForm((prev) => ({ ...prev, apiToken: event.target.value }))}
                  autoComplete="off"
                />
                {storedFlags.hasStoredApiToken && !form.apiToken ? (
                  <span className="settings-hint">{t('connectors.plugins.paperless.storedHint')}</span>
                ) : null}
              </label>
              <label className="settings-field">
                <span>{t('connectors.auth.fields.username')}</span>
                <Input
                  className="paperless-control"
                  value={form.username}
                  placeholder={
                    storedFlags.hasStoredUsername && !form.username ? secretPlaceholder : undefined
                  }
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="settings-field">
                <span>{t('connectors.auth.fields.password')}</span>
                <Input
                  className="paperless-control"
                  type="password"
                  value={form.password}
                  placeholder={
                    storedFlags.hasStoredPassword && !form.password ? secretPlaceholder : undefined
                  }
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  autoComplete="new-password"
                />
              </label>
              <div className="paperless-action-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="paperless-action-btn"
                  disabled={testBusy}
                  onClick={() => void handleTestConnection()}
                >
                  {testBusy ? t('connectors.plugins.paperless.testing') : t('connectors.plugins.paperless.testConnection')}
                </Button>
              </div>
            </div>
          </section>

          <section className="settings-section-card settings-section-card--compact">
            <div className="settings-section-body stack gap-md">
              <h2 className="settings-subheading">{t('connectors.plugins.paperless.pipelineTitle')}</h2>
              <label className="settings-check paperless-check">
                <input
                  type="checkbox"
                  checked={form.keepOcrText}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      keepOcrText: event.target.checked,
                      rerunOcr: event.target.checked ? false : prev.rerunOcr,
                    }))
                  }
                />
                <span>{t('connectors.plugins.paperless.keepOcr')}</span>
              </label>
              <label className="settings-check paperless-check">
                <input
                  type="checkbox"
                  checked={form.rerunOcr}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      rerunOcr: event.target.checked,
                      keepOcrText: event.target.checked ? false : prev.keepOcrText,
                    }))
                  }
                />
                <span>{t('connectors.plugins.paperless.rerunOcr')}</span>
              </label>
              <label className="settings-check paperless-check">
                <input
                  type="checkbox"
                  checked={form.includeArchivedPdf}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, includeArchivedPdf: event.target.checked }))
                  }
                />
                <span>{t('connectors.plugins.paperless.includeArchived')}</span>
              </label>
            </div>
          </section>

          <section className="settings-section-card settings-section-card--compact">
            <div className="settings-section-body stack gap-md">
              <h2 className="settings-subheading">{t('connectors.plugins.paperless.importTitle')}</h2>
              <div className="paperless-action-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="paperless-action-btn"
                  disabled={dryRunBusy}
                  onClick={() => void handleDryRun()}
                >
                  {dryRunBusy ? t('connectors.plugins.paperless.dryRunBusy') : t('connectors.plugins.paperless.dryRun')}
                </Button>
                <Button
                  type="button"
                  className="paperless-action-btn paperless-action-btn--primary"
                  disabled={importBusy || importLocked}
                  onClick={() => void handleStartImport()}
                >
                  {importBusy ? t('connectors.plugins.paperless.importBusy') : t('connectors.plugins.paperless.startImport')}
                </Button>
              </div>
              {dryRun ? (
                <div className="paperless-dry-run-summary settings-kv-list">
                  <div>{t('connectors.plugins.paperless.countDocuments', { count: dryRun.documentCount })}</div>
                  <div>{t('connectors.plugins.paperless.countTags', { count: dryRun.tagCount })}</div>
                  <div>{t('connectors.plugins.paperless.countCorrespondents', { count: dryRun.correspondentCount })}</div>
                  <div>{t('connectors.plugins.paperless.countTypes', { count: dryRun.documentTypeCount })}</div>
                  <div>{t('connectors.plugins.paperless.countPaths', { count: dryRun.storagePathCount })}</div>
                  <div>{t('connectors.plugins.paperless.countFields', { count: dryRun.customFieldCount })}</div>
                  {dryRun.mappingConflicts.length > 0 ? (
                    <div>{t('connectors.plugins.paperless.conflicts', { count: dryRun.mappingConflicts.length })}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {actionMessage ? (
            <p className="settings-callout settings-callout--info paperless-action-feedback" role="status">
              {actionMessage}
            </p>
          ) : null}

          {run ? (
            <section className="settings-section-card settings-section-card--compact">
              <div className="settings-section-body stack gap-md">
                <h2 className="settings-subheading">{t('connectors.plugins.paperless.runTitle')}</h2>
                <p className="settings-status-line" role="status">
                  {run.status === 'completed' && errors.length > 0
                    ? t('connectors.plugins.paperless.runCompletedWithErrors', {
                        processed: run.progressProcessed,
                      })
                    : run.progressTotal == null
                      ? t('connectors.plugins.paperless.runProgressNoTotal', {
                          status: t(`connectors.plugins.paperless.runStatus.${run.status}`),
                          processed: run.progressProcessed,
                        })
                      : t('connectors.plugins.paperless.runProgress', {
                          status: t(`connectors.plugins.paperless.runStatus.${run.status}`),
                          processed: run.progressProcessed,
                          total: run.progressTotal,
                        })}
                </p>
                {run.status === 'failed' && run.fatalErrorKey ? (
                  <p className="settings-callout settings-callout--error" role="alert">
                    {t(run.fatalErrorKey, {
                      defaultValue: t('connectors.plugins.paperless.runFailedGeneric'),
                    })}
                  </p>
                ) : null}
                {errors.length > 0 ? (
                  <ul className="paperless-import-errors">
                    {errors.map((row) => (
                      <li key={row.id}>
                        {t(row.messageKey, { defaultValue: row.messageKey })}
                        {row.sourceDocumentId ? ` (${row.sourceDocumentId})` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </SettingsSectionLayout>
  );
}
