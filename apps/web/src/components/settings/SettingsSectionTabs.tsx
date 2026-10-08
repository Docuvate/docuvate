import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSettingsSectionNavItems } from '../../lib/settingsSectionNav';

export function SettingsSectionTabs() {
  const { t } = useTranslation();
  const items = getSettingsSectionNavItems();
  const location = useLocation();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector(
      '.settings-section-tab--active, .settings-section-tab[aria-current="page"]',
    );
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [location.pathname]);

  return (
    <nav className="settings-section-tabs" aria-label={t('settings.navAria')}>
      <ul ref={listRef} className="settings-section-tabs-list">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `settings-section-tab${isActive ? ' settings-section-tab--active' : ''}`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
