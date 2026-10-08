import { NavLink, useLocation } from 'react-router-dom';
import {
  FileText,
  Folder,
  ListChecks,
  Settings,
  Tags,
} from 'lucide-react';
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
  { to: routes.documents, labelKey: 'nav.documents', end: false as const },
  {
    to: routes.structureLabels,
    labelKey: 'nav.labels',
    end: true as const,
  },
  {
    to: routes.structureRecognizedFields,
    labelKey: 'nav.recognizedFields',
    end: true as const,
  },
  {
    to: routes.filesystem,
    labelKey: 'nav.folders',
    end: false as const,
  },
] as const;

function documentsNavIsActive(pathname: string): boolean {
  return (
    pathname === routes.documents ||
    pathname === routes.inbox ||
    (pathname.startsWith('/documents/') && !pathname.startsWith('/documents?'))
  );
}

export function AppSidebar() {
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
        <nav className="sidebar-nav">
          {primaryNav.map(({ to, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => {
                if (to === routes.documents) {
                  return sidebarLinkClass(documentsNavIsActive(location.pathname));
                }
                return sidebarLinkClass(isActive);
              }}
              title={collapsed ? t(labelKey) : undefined}
            >
              {to === routes.documents ? (
                <NavIcon>
                  <FileText size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                </NavIcon>
              ) : null}
              {to === routes.structureLabels ? (
                <NavIcon>
                  <Tags size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                </NavIcon>
              ) : null}
              {to === routes.structureRecognizedFields ? (
                <NavIcon>
                  <ListChecks size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                </NavIcon>
              ) : null}
              {to === routes.filesystem ? (
                <NavIcon>
                  <Folder size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
                </NavIcon>
              ) : null}
              <span className="sidebar-link-label">{t(labelKey)}</span>
            </NavLink>
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
