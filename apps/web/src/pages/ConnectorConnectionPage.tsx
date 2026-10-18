// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorInstallationDto } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';

import { ConnectorDetailLayout } from '../components/connectors/ConnectorDetailLayout';
import { PageFormSaveKit } from '../components/save/PageFormSaveKit';
import { Input } from '../components/ui/Input';
import { getConnectorInstallation, updateConnectorInstallation } from '../lib/api';
import { formatConnectorError } from '../lib/connectorErrors';
import { parseConnectorPluginIdRoute } from '../lib/parseConnectorPluginIdRoute';
import { routes } from '../lib/routes';

export function ConnectorConnectionPage() {
  const { pluginId = '', connectionId = '' } = useParams();
  const routePluginId = parseConnectorPluginIdRoute(pluginId);
  const { t } = useTranslation();
  const [installation, setInstallation] = useState<ConnectorInstallationDto | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => displayName.trim() !== savedName.trim(), [displayName, savedName]);

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
      setDisplayName(row.displayName);
      setSavedName(row.displayName);
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
      const updated = await updateConnectorInstallation(installation.id, {
        displayName: displayName.trim(),
      });
      setInstallation(updated);
      setDisplayName(updated.displayName);
      setSavedName(updated.displayName);
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

  const activePluginId = installation?.pluginId ?? routePluginId;
  const labelKey = `connectors.plugins.${activePluginId}.label`;
  const connectionTitle =
    displayName.trim().length > 0
      ? displayName.trim()
      : (installation?.displayName ?? '…');

  return (
    <ConnectorDetailLayout
      pluginId={activePluginId}
      connectionId={connectionId}
      connectionName={connectionTitle}
      pluginLabelKey={labelKey}
      subtitle={t(labelKey)}
    >
      {loading ? <p className="muted">{t('connectors.loading')}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && installation ? (
        <>
          <section className="settings-section-card settings-section-card--compact">
            <div className="settings-section-body stack gap-md">
              <h2 className="settings-subheading">{t('connectors.detail.connectionSection')}</h2>
              <label className="settings-field">
                <span>{t('connectors.displayName')}</span>
                <Input
                  value={displayName}
                  required
                  disabled={saving}
                  onChange={(event) => { setDisplayName(event.target.value); }}
                  aria-label={t('connectors.displayName')}
                />
              </label>
              <p className="muted settings-hint">{t('connectors.detail.connectionHint')}</p>
            </div>
          </section>
          <PageFormSaveKit
            dirty={dirty}
            saving={saving}
            error={error}
            onSave={() => void save()}
            onDiscard={() => { setDisplayName(savedName); }}
          />
        </>
      ) : null}
    </ConnectorDetailLayout>
  );
}
