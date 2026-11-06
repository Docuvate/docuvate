// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { appSectionOf, PRIMARY_NAV } from '../../lib/appNav';
import { AppSectionIcon } from './AppSectionIcon';

/** First header row: the app's main areas as compact tabs (labels collapse to icons on tablets). */
export function AppPrimaryNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const section = appSectionOf(location.pathname);
  return (
    <nav className="app-primary-nav" aria-label={t('nav.main')}>
      {PRIMARY_NAV.map((item) => {
        const active = section === item.section;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`app-primary-nav-link${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
            title={t(item.labelKey)}
          >
            <AppSectionIcon section={item.section} size={16} />
            <span className="app-primary-nav-label">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
