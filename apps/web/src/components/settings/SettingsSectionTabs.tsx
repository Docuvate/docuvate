// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAdminAccess } from '../../lib/api';
import { getSettingsSectionNavItems } from '../../lib/settingsSectionNav';
import { routes } from '../../lib/routes';

function isAdministrationSectionPath(pathname: string): boolean {
  return pathname === routes.settingsAdmin || pathname.startsWith(`${routes.settingsAdmin}/`);
}

export function SettingsSectionTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [isAdministrator, setIsAdministrator] = useState(false);

  useEffect(() => {
    void getAdminAccess()
      .then((access) => setIsAdministrator(access.isAdministrator))
      .catch(() => setIsAdministrator(false));
  }, []);

  const items = useMemo(() => {
    const base = getSettingsSectionNavItems();
    if (!isAdministrator) {
      return base;
    }
    return [
      ...base,
      { to: routes.settingsAdmin, end: false, labelKey: 'settings.navAdministration' },
    ];
  }, [isAdministrator]);

  return (
    <nav className="settings-section-tabs" aria-label={t('settings.navAria')}>
      <ul className="settings-section-tabs-list">
        {items.map((item) => {
          const adminTab = item.to === routes.settingsAdmin;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => {
                  const active = adminTab ? isAdministrationSectionPath(pathname) : isActive;
                  return `settings-section-tab${active ? ' settings-section-tab--active' : ''}`;
                }}
              >
                {t(item.labelKey)}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
