// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewDto } from '@docuvate/contracts';
import { Bookmark, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { listSavedDocumentViews } from '../../lib/api';
import { routes } from '../../lib/routes';
import { SAVED_VIEWS_CHANGED } from '../../lib/savedViewsEvents';
import { savedViewSidebarLinkIsActive } from '../../lib/savedViewSidebarNav';

function sidebarLinkClass(isActive: boolean) {
  return `sidebar-link sidebar-saved-view-link${isActive ? ' active' : ''}`;
}

export function SavedViewsSidebar({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [views, setViews] = useState<SavedDocumentViewDto[]>([]);

  const reload = useCallback(() => {
    void listSavedDocumentViews()
      .then((items) => { setViews(items.filter((v) => v.pinnedSidebar).sort((a, b) => a.position - b.position)); }
      )
      .catch(() => { setViews([]); });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<SavedDocumentViewDto | undefined>).detail;
      if (detail?.pinnedSidebar) {
        setViews((prev) => {
          const merged = [...prev.filter((v) => v.id !== detail.id), detail];
          return merged.filter((v) => v.pinnedSidebar).sort((a, b) => a.position - b.position);
        });
      }
      reload();
    };
    window.addEventListener(SAVED_VIEWS_CHANGED, onChanged);
    return () => { window.removeEventListener(SAVED_VIEWS_CHANGED, onChanged); };
  }, [reload]);

  if (views.length === 0) {
    return null;
  }

  return (
    <div className="sidebar-saved-views" aria-label={t('savedViews.sidebarGroup')}>
      <div className="sidebar-saved-views-header">
        <span className="sidebar-saved-views-heading">{t('savedViews.sidebarGroupShort')}</span>
        <NavLink
          to={routes.savedViews}
          className={({ isActive }) =>
            `sidebar-saved-views-manage-link${isActive ? ' active' : ''}`
          }
          aria-label={t('savedViews.manageSettingsAria')}
          title={t('savedViews.manageSettingsAria')}
          aria-current={location.pathname === routes.savedViews ? 'page' : undefined}
        >
          <Settings2 size={20} strokeWidth={1.75} aria-hidden />
        </NavLink>
      </div>
      {views.map((view) => {
        const linkIsActive = savedViewSidebarLinkIsActive(
          location.pathname,
          location.search,
          view.id
        );
        return (
          <Link
            key={view.id}
            to={`${routes.documents}?view=${encodeURIComponent(view.id)}`}
            className={sidebarLinkClass(linkIsActive)}
            aria-current={linkIsActive ? 'page' : undefined}
            title={collapsed ? view.name : undefined}
          >
            <span className="sidebar-link-icon" aria-hidden>
              <Bookmark size={20} strokeWidth={1.75} />
            </span>
            <span className="sidebar-link-label">{view.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
