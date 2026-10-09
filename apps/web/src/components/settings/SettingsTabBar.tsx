// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { getAdminAccess } from '../../lib/api';
import { routes } from '../../lib/routes';

export function SettingsTabBar() {
  const { t } = useTranslation();
  const [isAdministrator, setIsAdministrator] = useState(false);

  useEffect(() => {
    void getAdminAccess()
      .then((access) => setIsAdministrator(access.isAdministrator))
      .catch(() => setIsAdministrator(false));
  }, []);

  return (
    <nav className="settings-tabbar" aria-label={t('settings.tabsAria')}>
      <NavLink
        to={routes.settings}
        end
        className={({ isActive }) =>
          isActive ? 'settings-tab settings-tab--active' : 'settings-tab'
        }
      >
        {t('settings.tabOverview')}
      </NavLink>
      <NavLink
        to={routes.settingsConnectors}
        className={({ isActive }) =>
          isActive ? 'settings-tab settings-tab--active' : 'settings-tab'
        }
      >
        {t('settings.tabConnectors')}
      </NavLink>
      <NavLink
        to={routes.settingsBlockedLabels}
        className={({ isActive }) =>
          isActive ? 'settings-tab settings-tab--active' : 'settings-tab'
        }
      >
        {t('settings.tabBlockedLabels')}
      </NavLink>
      <NavLink
        to={routes.settingsAccountSecurity}
        className={({ isActive }) =>
          isActive ? 'settings-tab settings-tab--active' : 'settings-tab'
        }
      >
        {t('settings.tabAccountSecurity')}
      </NavLink>
      {isAdministrator ? (
        <NavLink
          to={routes.settingsAdmin}
          className={({ isActive }) =>
            isActive ? 'settings-tab settings-tab--active' : 'settings-tab'
          }
        >
          {t('admin.settingsLinkTitle')}
        </NavLink>
      ) : null}
    </nav>
  );
}
