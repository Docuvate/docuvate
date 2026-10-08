import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import type {
  ConnectorCatalogResponse,
  ConnectorCategoryId,
  ConnectorInstallationDto,
  ConnectorPluginCatalogEntryDto,
} from '@docuvate/contracts';
import {
  createConnectorInstallation,
  deleteConnectorInstallation,
  getConnectorCatalog,
  listConnectorInstallations,
  startConnectorOAuth,
} from '../lib/api';
import { formatConnectorError } from '../lib/connectorErrors';
import {
  connectorOAuthConfigured,
  connectorOAuthMissingEnvVars,
} from '../lib/connectorOAuth';
import { AlertDialog } from '../components/ui/AlertDialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { connectorsOAuthSetupDocUrl } from '../lib/connectorOAuthSetupDoc';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConnectorConnectDialog } from '../components/connectors/ConnectorConnectDialog';
import { ConnectorPluginIcon } from '../components/connectors/ConnectorPluginIcon';
import { useToastNotify } from '../components/save/ToastProvider';
import { SftpScannerIngressSection } from '../components/connectors/SftpScannerIngressSection';

function capabilityLabel(t: (key: string) => string, role: 'source' | 'sink') {
  return t(`connectors.capabilities.${role}`);
}

type CategoryFilter = 'all' | ConnectorCategoryId;

export function ConnectorsPage() {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [catalog, setCatalog] = useState<ConnectorCatalogResponse | null>(null);
  const [installations, setInstallations] = useState<ConnectorInstallationDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectPlugin, setConnectPlugin] = useState<ConnectorPluginCatalogEntryDto | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [oauthAlertOpen, setOauthAlertOpen] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState<ConnectorInstallationDto | null>(null);

  useEffect(() => {
    const oauth = searchParams.get('oauth');
    if (oauth === 'success') {
      setError(null);
      void listConnectorInstallations()
        .then(setInstallations)
        .finally(() => {
          setOauthAlertOpen(true);
          setSearchParams({}, { replace: true });
        });
    } else if (oauth === 'error') {
      setError(t('connectors.oauthError'));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    void Promise.all([getConnectorCatalog(), listConnectorInstallations()])
      .then(([cat, inst]) => {
        setCatalog(cat);
        setInstallations(inst);
      })
      .catch((err: unknown) => {
        setError(formatConnectorError(err, 'connectors.loadFailed'));
      });
  }, []);

  const installedByPlugin = useMemo(() => {
    return new Map(installations.map((row) => [row.pluginId, row]));
  }, [installations]);

  const filteredPlugins = useMemo(() => {
    if (!catalog) return [];
    const query = searchQuery.trim().toLowerCase();
    return catalog.plugins.filter((plugin) => {
      if (categoryFilter !== 'all' && plugin.categoryId !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      const label = t(plugin.labelKey).toLowerCase();
      const description = t(plugin.descriptionKey).toLowerCase();
      return label.includes(query) || description.includes(query);
    });
  }, [catalog, categoryFilter, searchQuery, t]);

  const categoryOrder = useMemo(
    () => new Map(catalog?.categories.map((category, index) => [category.id, index]) ?? []),
    [catalog]
  );

  const sortedFilteredPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      const orderA = categoryOrder.get(a.categoryId) ?? 0;
      const orderB = categoryOrder.get(b.categoryId) ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return t(a.labelKey).localeCompare(t(b.labelKey), undefined, { sensitivity: 'base' });
    });
  }, [filteredPlugins, categoryOrder, t]);

  function categoryLabelFor(plugin: ConnectorPluginCatalogEntryDto): string {
    const category = catalog?.categories.find((entry) => entry.id === plugin.categoryId);
    return category ? t(category.labelKey) : plugin.categoryId;
  }
  const showSftpScannerCard = useMemo(() => {
    if (categoryFilter !== 'all' && categoryFilter !== 'scanner_sftp') {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const haystack = [
      t('sftpIngress.title'),
      t('sftpIngress.lead'),
      'sftp',
      'scanner',
      t('connectors.categories.scannerSftp.label'),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }, [categoryFilter, searchQuery, t]);

  async function submitConnect(payload: {
    displayName: string;
    credentials: Record<string, string>;
  }) {
    if (!connectPlugin) return;
    setConnectBusy(true);
    setError(null);
    try {
      const created = await createConnectorInstallation({
        pluginId: connectPlugin.id,
        displayName: payload.displayName,
        credentials: payload.credentials,
      });
      setInstallations((prev) => {
        const without = prev.filter((p) => p.pluginId !== created.pluginId);
        return [...without, created];
      });
      setConnectPlugin(null);
      pushSuccess();
    } catch (err) {
      const message = formatConnectorError(err, 'connectors.connectFailed');
      setError(message);
      pushError(message);
    } finally {
      setConnectBusy(false);
    }
  }

  async function submitOAuthConnect(payload: { displayName: string; accountHint?: string }) {
    if (!connectPlugin || (connectPlugin.id !== 'gmail' && connectPlugin.id !== 'outlook')) {
      return;
    }
    setConnectBusy(true);
    setError(null);
    try {
      const { authorizationUrl } = await startConnectorOAuth(connectPlugin.id, payload);
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError(formatConnectorError(err, 'connectors.connectFailed'));
      setConnectBusy(false);
    }
  }

  function disconnectInstallation(installation: ConnectorInstallationDto) {
    setPendingDisconnect(installation);
  }

  async function confirmDisconnect() {
    const installation = pendingDisconnect;
    if (!installation) return;
    setPendingDisconnect(null);
    setDisconnectingId(installation.id);
    setError(null);
    try {
      await deleteConnectorInstallation(installation.id);
      setInstallations((prev) => prev.filter((row) => row.id !== installation.id));
      pushSuccess();
    } catch (err) {
      const message = formatConnectorError(err, 'connectors.disconnectFailed');
      setError(message);
      pushError(message);
    } finally {
      setDisconnectingId(null);
    }
  }

  function disconnectDisplayName(installation: ConnectorInstallationDto): string {
    const pluginLabel = catalog?.plugins.find((p) => p.id === installation.pluginId);
    return pluginLabel ? t(pluginLabel.labelKey) : installation.displayName;
  }

  function renderAdminOAuthDetails(plugin: ConnectorPluginCatalogEntryDto) {
    if (connectorOAuthConfigured(plugin) || plugin.auth.strategy !== 'oauth2') {
      return null;
    }
    if (!(catalog?.viewerIsServerAdmin ?? false)) {
      return null;
    }
    const docUrl = connectorsOAuthSetupDocUrl();
    const missingVars = connectorOAuthMissingEnvVars(plugin);
    return (
      <details className="connector-oauth-admin-details">
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
    );
  }

  function connectDisabledHint(plugin: ConnectorPluginCatalogEntryDto, oauthReady: boolean): string | undefined {
    if (oauthReady || plugin.auth.strategy !== 'oauth2') {
      return undefined;
    }
    return t('connectors.connectDisabledOAuth');
  }

  function renderPluginCard(plugin: ConnectorPluginCatalogEntryDto) {
    const installed = installedByPlugin.get(plugin.id);
    const oauthReady = connectorOAuthConfigured(plugin);
    const cardClass = installed
      ? 'connector-catalog-card connector-catalog-card--connected'
      : 'connector-catalog-card';
    return (
      <article key={plugin.id} className={cardClass}>
        <div className="connector-catalog-card-body">
          <div className="connector-catalog-card-top">
            <ConnectorPluginIcon pluginId={plugin.id} />
            <div className="connector-catalog-heading">
              <div className="connector-catalog-title-row">
                <h3>{t(plugin.labelKey)}</h3>
                {installed ? (
                  <span className="connector-connected-badge">{t('connectors.connectedBadge')}</span>
                ) : null}
              </div>
              <p className="connector-catalog-category">{categoryLabelFor(plugin)}</p>
              <p className="muted connector-catalog-description">{t(plugin.descriptionKey)}</p>
            </div>
          </div>
          {installed ? (
            <p className="connector-connected-as">{t('connectors.connectedAs', { name: installed.displayName })}</p>
          ) : null}
          {!installed && !oauthReady && plugin.auth.strategy === 'oauth2' ? (
            <p className="connector-oauth-status muted" title={connectDisabledHint(plugin, oauthReady)}>
              <Info size={16} strokeWidth={2} aria-hidden />
              <span>{t('connectors.oauthNotConfiguredShort')}</span>
            </p>
          ) : null}
          {!installed ? renderAdminOAuthDetails(plugin) : null}
        </div>
        <footer className="connector-catalog-card-footer">
          <div className="connector-catalog-badges">
            {plugin.capabilities.map((role) => (
              <span key={role} className="connector-capability-badge">
                {capabilityLabel(t, role)}
              </span>
            ))}
            {plugin.tier === 'commercial' ? (
              <span className="connector-capability-badge connector-capability-badge--muted">
                {t('connectors.tierCommercial')}
              </span>
            ) : null}
          </div>
          <div className="connector-catalog-actions">
            {installed ? (
              <Button
                type="button"
                variant="secondary"
                disabled={disconnectingId === installed.id}
                onClick={() => void disconnectInstallation(installed)}
              >
                {disconnectingId === installed.id
                  ? t('connectors.disconnectPending')
                  : t('connectors.disconnectCta')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={!oauthReady}
                title={connectDisabledHint(plugin, oauthReady)}
                onClick={() => setConnectPlugin(plugin)}
              >
                {t('connectors.connectCta')}
              </Button>
            )}
          </div>
        </footer>
      </article>
    );
  }

  return (
    <SettingsSectionLayout sectionTitle={t('connectors.title')} sectionLead={t('connectors.lead')}>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {!catalog ? <p className="muted">{t('connectors.loading')}</p> : null}

      {catalog ? (
        <>
          <div className="connector-catalog-toolbar">
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('connectors.searchPlaceholder')}
              aria-label={t('connectors.searchAria')}
              className="connector-catalog-search"
            />
            <div className="connector-category-chips" role="group" aria-label={t('connectors.filterGroupAria')}>
              <button
                type="button"
                className={`connector-category-chip${categoryFilter === 'all' ? ' active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                {t('connectors.filterAll')}
              </button>
              {catalog.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`connector-category-chip${categoryFilter === category.id ? ' active' : ''}`}
                  onClick={() => setCategoryFilter(category.id)}
                >
                  {t(category.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {filteredPlugins.length === 0 && !showSftpScannerCard ? (
            <p className="muted">{t('connectors.emptySearch')}</p>
          ) : (
            <div className="connector-catalog-grid">
              {showSftpScannerCard ? (
                <SftpScannerIngressSection viewerIsServerAdmin={catalog.viewerIsServerAdmin ?? false} />
              ) : null}
              {sortedFilteredPlugins.map(renderPluginCard)}
            </div>
          )}
        </>
      ) : null}

      <ConnectorConnectDialog
        open={connectPlugin != null}
        plugin={connectPlugin}
        busy={connectBusy}
        viewerIsServerAdmin={catalog?.viewerIsServerAdmin ?? false}
        onSubmit={(payload) => void submitConnect(payload)}
        onOAuthStart={(payload) => void submitOAuthConnect(payload)}
        onCancel={() => {
          if (!connectBusy) setConnectPlugin(null);
        }}
      />

      <AlertDialog
        open={oauthAlertOpen}
        title={t('connectors.oauthSuccessTitle')}
        description={t('connectors.oauthSuccess')}
        onClose={() => setOauthAlertOpen(false)}
      />

      <ConfirmDialog
        open={pendingDisconnect != null}
        title={
          pendingDisconnect
            ? t('connectors.disconnectConfirm', { name: disconnectDisplayName(pendingDisconnect) })
            : ''
        }
        description={t('connectors.disconnectDescription')}
        confirmLabel={t('common.confirm')}
        tone="danger"
        busy={disconnectingId != null}
        onCancel={() => setPendingDisconnect(null)}
        onConfirm={() => void confirmDisconnect()}
      />
    </SettingsSectionLayout>
  );
}
