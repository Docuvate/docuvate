import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSettingsSectionNavItems } from '../../lib/settingsSectionNav';

export function SettingsSectionTabs() {
  const { t } = useTranslation();
  const items = getSettingsSectionNavItems();

  return (
    <nav className="settings-section-tabs" aria-label={t('settings.navAria')}>
      <ul className="settings-section-tabs-list">
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
