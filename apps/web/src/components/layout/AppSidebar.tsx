// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Settings, X } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';

import { appSectionOf, PRIMARY_NAV } from '../../lib/appNav';
import { routes } from '../../lib/routes';
import { AppSectionIcon } from './AppSectionIcon';
import { SavedViewsSidebar } from './SavedViewsSidebar';

function sidebarLinkClass(isActive: boolean) {
  return `sidebar-link${isActive ? ' active' : ''}`;
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Navigation drawer for narrow screens. On wider screens the same entries live in the global
 * header, so the content always gets the full width.
 */
export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const section = appSectionOf(location.pathname);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  return (
    <div className="app-sidebar-rail" data-open={open ? 'true' : 'false'}>
      <aside className="app-sidebar" aria-label={t('nav.main')} hidden={!open}>
        <div className="sidebar-drawer-header">
          <span className="sidebar-drawer-title">{t('nav.main')}</span>
          <button
            ref={closeRef}
            type="button"
            className="sidebar-drawer-close"
            aria-label={t('common.close')}
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <nav className="sidebar-nav">
          {PRIMARY_NAV.map((item) => (
            <Fragment key={item.to}>
              <NavLink
                to={item.to}
                className={sidebarLinkClass(section === item.section)}
                aria-current={section === item.section ? 'page' : undefined}
                onClick={onClose}
              >
                <span className="sidebar-link-icon" aria-hidden>
                  <AppSectionIcon section={item.section} />
                </span>
                <span className="sidebar-link-label">{t(item.labelKey)}</span>
              </NavLink>
              {item.section === 'documents' ? <SavedViewsSidebar /> : null}
            </Fragment>
          ))}
          <div className="sidebar-footer">
            <NavLink
              to={routes.settings}
              className={sidebarLinkClass(section === 'settings')}
              onClick={onClose}
            >
              <span className="sidebar-link-icon" aria-hidden>
                <Settings size={20} strokeWidth={1.75} />
              </span>
              <span className="sidebar-link-label">{t('nav.settings')}</span>
            </NavLink>
          </div>
        </nav>
      </aside>
    </div>
  );
}
