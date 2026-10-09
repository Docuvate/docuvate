// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';
import type { AdminAccessResponse } from '@docuvate/contracts';
import { getAdminAccess } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { routes } from '../../lib/routes';
import { SettingsSectionCard } from '../../components/settings/SettingsSectionCard';
import { AdminSettingsLayout } from '../../components/admin/AdminSettingsLayout';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true as const };

export function AdminSettingsPage() {
  const { t } = useTranslation();
  const [access, setAccess] = useState<AdminAccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminAccess()
      .then(setAccess)
      .catch((err: unknown) => {
        setError(formatUserFacingError(err, 'errors.loadFailed'));
      });
  }, []);

  return (
    <AdminSettingsLayout sectionTitle={t('admin.hubTitle')} sectionLead={t('admin.hubLead')}>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="settings-grid">
        <SettingsSectionCard
          icon={<Users {...ICON} />}
          title={t('admin.usersLinkTitle')}
          description={t('admin.usersLinkLead')}
          footer={
            <div className="settings-section-card-footer">
              <Link
                className="settings-card-link btn btn-secondary settings-card-link-btn"
                to={routes.settingsAdminUsers}
              >
                <span>{t('admin.usersLinkCta')}</span>
              </Link>
            </div>
          }
        />

        <SettingsSectionCard
          className="settings-section-card--full"
          icon={<Shield {...ICON} />}
          title={t('admin.rolesTitle')}
          description={t('admin.rolesLead')}
        >
          <ul className="admin-role-list">
            {(access?.roleDescriptions ?? []).map((entry) => (
              <li key={entry.role}>
                <strong>{t(`admin.roles.${entry.role}`)}</strong>
                <p className="muted">{t(entry.summaryKey)}</p>
              </li>
            ))}
          </ul>
        </SettingsSectionCard>
      </div>
    </AdminSettingsLayout>
  );
}
