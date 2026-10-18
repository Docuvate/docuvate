// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AdminAuthSignInSettingsDto } from '@docuvate/contracts';
import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAdminAuthSignInSettings } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { SettingsSectionCard } from '../settings/SettingsSectionCard';
import { Switch } from '../ui/Switch';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true as const };

export function AdminAuthSignInCard() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AdminAuthSignInSettingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminAuthSignInSettings()
      .then(setSettings)
      .catch((err: unknown) => {
        setError(formatUserFacingError(err, 'errors.loadFailed'));
      });
  }, []);

  return (
    <SettingsSectionCard
      icon={<KeyRound {...ICON} />}
      title={t('admin.authSignIn.title')}
      description={t('admin.authSignIn.lead')}
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="settings-stack">
        <Switch
          label={t('admin.authSignIn.passkeysEnabled')}
          checked={settings?.passkeysEnabled ?? true}
          disabled
          onCheckedChange={() => undefined}
        />
        <div>
          <p className="settings-field-label">{t('admin.authSignIn.oidcProvidersTitle')}</p>
          {settings?.oidcProviders.length ? (
            <ul className="admin-oidc-readonly-list">
              {settings.oidcProviders.map((provider) => (
                <li key={provider.id}>
                  <strong>{provider.displayName}</strong>
                  <span className="muted">
                    {' · '}
                    {provider.source === 'env'
                      ? t('admin.authSignIn.oidcSourceEnv')
                      : t('admin.authSignIn.oidcSourceAdmin')}
                    {!provider.enabled ? ` · ${t('admin.authSignIn.oidcDisabled')}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('admin.authSignIn.oidcEmpty')}</p>
          )}
        </div>
      </div>
    </SettingsSectionCard>
  );
}
