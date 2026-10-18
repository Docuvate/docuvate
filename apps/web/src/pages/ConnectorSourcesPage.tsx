// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorInstallationDto, ConnectorSourceScopeDto } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';

import { ConnectorDetailLayout } from '../components/connectors/ConnectorDetailLayout';
import { ConnectorSourceScopePicker } from '../components/connectors/ConnectorSourceScopePicker';
import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import {
  getConnectorInstallation,
  listConnectorInstallationSourceNodes,
  updateConnectorInstallation,
} from '../lib/api';
import { formatConnectorError } from '../lib/connectorErrors';
import { parseConnectorPluginIdRoute } from '../lib/parseConnectorPluginIdRoute';
import { routes } from '../lib/routes';

function scopesEqual(a: ConnectorSourceScopeDto, b: ConnectorSourceScopeDto): boolean {
  if (a.mode !== b.mode) return false;
  if (a.mode === 'all') return true;
  if (a.paths.length !== b.paths.length) return false;
  const sortedA = [...a.paths].sort();
  const sortedB = [...b.paths].sort();
  return sortedA.every((path, index) => path === sortedB[index]);
}

export function ConnectorSourcesPage() {
  const { pluginId = '', connectionId = '' } = useParams();
  const { t } = useTranslation();
  const routePluginId = parseConnectorPluginIdRoute(pluginId);
  const [installation, setInstallation] = useState<ConnectorInstallationDto | null>(null);
  const [scope, setScope] = useState<ConnectorSourceScopeDto>({ mode: 'all', paths: [] });
  const [savedScope, setSavedScope] = useState<ConnectorSourceScopeDto>({ mode: 'all', paths: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => !scopesEqual(scope, savedScope), [scope, savedScope]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getConnectorInstallation(connectionId);
      if (row.pluginId !== pluginId) {
        setInstallation(null);
        return;
      }
      setInstallation(row);
      setScope(row.sourceScope);
      setSavedScope(row.sourceScope);
    } catch (err: unknown) {
      setError(formatConnectorError(err, 'connectors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [connectionId, pluginId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!installation) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateConnectorInstallation(installation.id, { sourceScope: scope });
      setInstallation(updated);
      setScope(updated.sourceScope);
      setSavedScope(updated.sourceScope);
    } catch (err: unknown) {
      setError(formatConnectorError(err, 'connectors.connectFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (!routePluginId || !connectionId) {
    return <Navigate to={routes.settingsConnectors} replace />;
  }

  if (!loading && !installation) {
    return <Navigate to={routes.settingsConnectors} replace />;
  }

  const activeInstallation = installation;
  const labelKey = activeInstallation
    ? `connectors.plugins.${activeInstallation.pluginId}.label`
    : `connectors.plugins.${routePluginId}.label`;
  const rootLabel =
    (activeInstallation?.pluginId ?? routePluginId) === 'amazon_s3'
      ? t('connectors.sources.rootBucket', {
          name: activeInstallation?.displayName ?? t('connectors.sources.rootBucketFallback'),
        })
      : t('connectors.sources.rootMailbox');

  return (
    <ConnectorDetailLayout
      pluginId={activeInstallation?.pluginId ?? routePluginId}
      connectionId={connectionId}
      connectionName={activeInstallation?.displayName ?? '…'}
      pluginLabelKey={labelKey}
      tailLabel={t('connectors.detail.tabSources')}
    >
      {loading ? <p className="muted">{t('connectors.loading')}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {activeInstallation ? (
        <>
          <ConnectorSourceScopePicker
            rootLabel={rootLabel}
            scope={scope}
            onScopeChange={setScope}
            disabled={saving}
            loadNodes={(parentPath) =>
              listConnectorInstallationSourceNodes(activeInstallation.id, parentPath)
            }
          />
          <PageFormSaveKit
            dirty={dirty}
            saving={saving}
            error={error}
            onSave={() => void save()}
            onDiscard={() => { setScope(savedScope); }}
          />
        </>
      ) : null}
    </ConnectorDetailLayout>
  );
}
