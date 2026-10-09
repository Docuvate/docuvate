// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FileText,
  Folder,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  Tags,
  X,
} from 'lucide-react';
import { SavedViewsSidebar } from './SavedViewsSidebar';
import { useTranslation } from 'react-i18next';
import { routes } from '../../lib/routes';
import { usePersistedSidebarCollapsed } from '../../lib/usePersistedSidebarCollapsed';
import { BorderCollapsibleRail } from '../ui/BorderCollapsibleRail';

const NAV_ICON_SIZE = 20;
const NAV_ICON_STROKE = 1.75;

function sidebarLinkClass(isActive: boolean) {
  return `sidebar-link${isActive ? ' active' : ''}`;
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="sidebar-link-icon" aria-hidden>
      {children}
    </span>
  );
}

const primaryNav = [
  { to: routes.home, labelKey: 'nav.home', end: true as const, icon: 'home' as const },
  {
    to: routes.documents,
    labelKey: 'nav.documents',
    end: false as const,
    icon: 'documents' as const,
  },
  { to: routes.globalChat, labelKey: 'nav.globalChat', end: true as const, icon: 'chat' as const },
  {
    to: routes.structureLabels,
    labelKey: 'nav.labels',
    end: true as const,
    icon: 'labels' as const,
  },
  {
    to: routes.structureRecognizedFields,
    labelKey: 'nav.recognizedFields',
    end: true as const,
    icon: 'recognized' as const,
  },
  {
    to: routes.filesystem,
    labelKey: 'nav.folders',
    end: false as const,
    icon: 'folders' as const,
  },
] as const;

function documentsNavIsActive(pathname: string, search: string): boolean {
  if (pathname === routes.savedViews) {
    return false;
  }
  const params = new URLSearchParams(search);
  if (pathname === routes.documents && params.has('view')) {
    return false;
  }
  return (
    pathname === routes.documents ||
    pathname === routes.inbox ||
    (pathname.startsWith('/documents/') && !pathname.startsWith('/documents/views'))
  );
}

type AppSidebarProps = {
  mobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
};

export function AppSidebar({ mobileDrawerOpen = false, onCloseMobileDrawer }: AppSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [collapsed, setCollapsed] = usePersistedSidebarCollapsed();

  return (
    <BorderCollapsibleRail
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
      expandLabel={t('nav.expandSidebar')}
      collapseLabel={t('nav.collapseSidebar')}
      railClassName="app-sidebar-rail"
      panelClassName="app-sidebar"
      collapsedPanelClassName="app-sidebar-collapsed"
    >
      <aside aria-label={t('nav.main')}>
        {mobileDrawerOpen ? (
          <div className="sidebar-drawer-header">
            <span className="sidebar-drawer-title">{t('nav.main')}</span>
            <button
              type="button"
              className="sidebar-drawer-close"
              aria-label={t('common.close')}
              onClick={() => onCloseMobileDrawer?.()}
            >
              <X size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
        <nav className="sidebar-nav">
          {primaryNav.map(({ to, labelKey, end, icon }) => (
            <Fragment key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => {
                  if (to === routes.documents) {
                    return sidebarLinkClass(
                      documentsNavIsActive(location.pathname, location.search)
                    );
                  }
                  return sidebarLinkClass(isActive);
                }}
                title={collapsed ? t(labelKey) : undefined}
              >
                {icon === 'home' ? (
                  <NavIcon>
                    <LayoutDashboard size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                {icon === 'documents' ? (
                  <NavIcon>
                    <FileText size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                {icon === 'labels' ? (
                  <NavIcon>
                    <Tags size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                {icon === 'recognized' ? (
                  <NavIcon>
                    <ListChecks size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                {icon === 'folders' ? (
                  <NavIcon>
                    <Folder size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                {icon === 'chat' ? (
                  <NavIcon>
                    <MessageSquare size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                  </NavIcon>
                ) : null}
                <span className="sidebar-link-label">{t(labelKey)}</span>
              </NavLink>
              {to === routes.documents ? (
                <>
                  <SavedViewsSidebar key={`${to}-saved`} collapsed={collapsed} />
                  {!collapsed ? (
                    <div className="sidebar-nav-separator" role="presentation" />
                  ) : null}
                </>
              ) : null}
            </Fragment>
          ))}

          <div className="sidebar-footer">
            <NavLink
              to={routes.settings}
              className={({ isActive }) => sidebarLinkClass(isActive)}
              title={collapsed ? t('nav.settings') : undefined}
            >
              <NavIcon>
                <Settings size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
              </NavIcon>
              <span className="sidebar-link-label">{t('nav.settings')}</span>
            </NavLink>
          </div>
        </nav>
      </aside>
    </BorderCollapsibleRail>
  );
}
