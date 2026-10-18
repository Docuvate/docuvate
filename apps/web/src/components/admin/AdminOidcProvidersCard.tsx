// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AdminOidcProviderDto,
  CreateAdminOidcProviderRequest,
  UpdateAdminOidcProviderRequest,
} from '@docuvate/contracts';
import { Globe } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createAdminOidcProvider,
  deleteAdminOidcProvider,
  getAdminAuthSignInSettings,
  updateAdminOidcProvider,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { notifySaved, notifySaveError } from '../../lib/saveNotify';
import { useFormDraft } from '../../lib/useFormDraft';
import { PageFormSaveKit } from '../save/PageFormSaveKit';
import { SettingsSectionCard } from '../settings/SettingsSectionCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true as const };

const EMPTY_DRAFT: CreateAdminOidcProviderRequest = {
  providerId: '',
  displayName: '',
  issuer: '',
  clientId: '',
  clientSecret: '',
  scopes: 'openid email profile',
  enabled: true,
};

export function AdminOidcProvidersCard() {
  const { t } = useTranslation();
  const providerIdField = useId();
  const [providers, setProviders] = useState<AdminOidcProviderDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = providers.find((p) => p.id === selectedId) ?? null;
  const editingAdmin = selected?.source === 'admin';
  const formBaseline = useMemo((): CreateAdminOidcProviderRequest & { clientSecret?: string } => {
    if (editingAdmin && selected) {
      return {
        providerId: selected.providerId,
        displayName: selected.displayName,
        issuer: selected.issuer,
        clientId: selected.clientId,
        clientSecret: '',
        scopes: selected.scopes,
        enabled: selected.enabled,
      };
    }
    return EMPTY_DRAFT;
  }, [editingAdmin, selected]);
  const form = useFormDraft(formBaseline);

  async function reload() {
    const settings = await getAdminAuthSignInSettings();
    setProviders(settings.oidcProviders);
  }

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setLoadError(formatUserFacingError(err, 'errors.loadFailed'));
    });
  }, []);

  async function save(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      if (editingAdmin && selected) {
        const body: UpdateAdminOidcProviderRequest = {
          displayName: form.draft.displayName,
          issuer: form.draft.issuer,
          clientId: form.draft.clientId,
          scopes: form.draft.scopes,
          enabled: form.draft.enabled,
        };
        if (form.draft.clientSecret?.trim()) {
          body.clientSecret = form.draft.clientSecret.trim();
        }
        await updateAdminOidcProvider(selected.id, body);
      } else {
        const createBody: CreateAdminOidcProviderRequest = {
          providerId: form.draft.providerId,
          displayName: form.draft.displayName,
          issuer: form.draft.issuer,
          clientId: form.draft.clientId,
          clientSecret: form.draft.clientSecret ?? '',
          scopes: form.draft.scopes,
          enabled: form.draft.enabled,
        };
        await createAdminOidcProvider(createBody);
      }
      await reload();
      form.commit(form.draft);
      notifySaved();
    } catch (err) {
      const message = formatUserFacingError(err, 'admin.oidcProviders.saveFailed');
      setSaveError(message);
      notifySaveError(message, () => void save());
    } finally {
      setSaving(false);
    }
  }

  async function removeSelected() {
    if (!selected || selected.source !== 'admin') {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await deleteAdminOidcProvider(selected.id);
      setSelectedId(null);
      await reload();
      notifySaved();
    } catch (err) {
      setSaveError(formatUserFacingError(err, 'admin.oidcProviders.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSectionCard
      className="settings-section-card--full"
      icon={<Globe {...ICON} />}
      title={t('admin.oidcProviders.title')}
      description={t('admin.oidcProviders.lead')}
    >
      {loadError ? (
        <p className="error" role="alert">
          {loadError}
        </p>
      ) : null}
      <div className="admin-oidc-layout settings-stack">
        <div className="admin-oidc-list">
          <Button type="button" variant="secondary" onClick={() => { setSelectedId(null); }}>
            {t('admin.oidcProviders.newProvider')}
          </Button>
          <ul>
            {providers
              .filter((p) => p.source === 'admin')
              .map((provider) => (
                <li key={provider.id}>
                  <Button
                    type="button"
                    variant={selectedId === provider.id ? 'primary' : 'secondary'}
                    onClick={() => { setSelectedId(provider.id); }}
                  >
                    {provider.displayName}
                  </Button>
                </li>
              ))}
          </ul>
        </div>
        <div className="admin-oidc-form settings-stack">
          {!editingAdmin ? (
            <label className="settings-field" htmlFor={providerIdField}>
              {t('admin.oidcProviders.providerIdLabel')}
              <Input
                id={providerIdField}
                value={form.draft.providerId}
                disabled={saving}
                onChange={(e) => {
                  form.setDraft({ ...form.draft, providerId: e.target.value });
                }}
              />
            </label>
          ) : null}
          <label className="settings-field">
            {t('admin.oidcProviders.displayNameLabel')}
            <Input
              value={form.draft.displayName}
              disabled={saving}
              onChange={(e) => {
                form.setDraft({ ...form.draft, displayName: e.target.value });
              }}
            />
          </label>
          <label className="settings-field">
            {t('admin.oidcProviders.issuerLabel')}
            <Input
              value={form.draft.issuer}
              disabled={saving}
              onChange={(e) => {
                form.setDraft({ ...form.draft, issuer: e.target.value });
              }}
            />
          </label>
          <label className="settings-field">
            {t('admin.oidcProviders.clientIdLabel')}
            <Input
              value={form.draft.clientId}
              disabled={saving}
              onChange={(e) => {
                form.setDraft({ ...form.draft, clientId: e.target.value });
              }}
            />
          </label>
          <label className="settings-field">
            {t('admin.oidcProviders.clientSecretLabel')}
            <Input
              type="password"
              value={form.draft.clientSecret ?? ''}
              disabled={saving}
              placeholder={
                editingAdmin && selected?.hasClientSecret
                  ? t('admin.oidcProviders.clientSecretKeepPlaceholder')
                  : undefined
              }
              onChange={(e) => {
                form.setDraft({ ...form.draft, clientSecret: e.target.value });
              }}
            />
          </label>
          <label className="settings-field">
            {t('admin.oidcProviders.scopesLabel')}
            <Input
              value={form.draft.scopes}
              disabled={saving}
              onChange={(e) => {
                form.setDraft({ ...form.draft, scopes: e.target.value });
              }}
            />
          </label>
          <Switch
            label={t('admin.oidcProviders.enabledLabel')}
            checked={form.draft.enabled}
            disabled={saving}
            onCheckedChange={(enabled) => {
              form.setDraft({ ...form.draft, enabled });
            }}
          />
          {saveError ? (
            <p className="error" role="alert">
              {saveError}
            </p>
          ) : null}
          {editingAdmin ? (
            <Button type="button" variant="secondary" disabled={saving} onClick={() => void removeSelected()}>
              {t('admin.oidcProviders.delete')}
            </Button>
          ) : null}
        </div>
      </div>
      <PageFormSaveKit
        dirty={form.dirty}
        saving={saving}
        onSave={() => void save()}
        onDiscard={() => { form.discard(); }}
      />
    </SettingsSectionCard>
  );
}
