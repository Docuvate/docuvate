// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SavedDocumentViewDto } from '@docuvate/contracts';
import { Bookmark, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { usePinnedSavedViews } from '../../lib/saved-views/usePinnedSavedViews';
import { savedViewSidebarLinkIsActive } from '../../lib/savedViewSidebarNav';

function sidebarLinkClass(isActive: boolean) {
  return `sidebar-link sidebar-saved-view-link${isActive ? ' active' : ''}`;
}

/** Pinned saved views in the mobile navigation drawer. */
export function SavedViewsSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const views = usePinnedSavedViews();

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
      {views.map((view: SavedDocumentViewDto) => {
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
