// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Bookmark, ChevronDown, RefreshCw, Save, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { MenuItem } from '../ui/MenuItem';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';

interface LibrarySavedViewsMenuProps {
  /** Set when a saved view is active; enables "update from filters". */
  onUpdateActiveView?: () => void;
  onSaveView: () => void;
}

/** Saved-view actions grouped behind one trigger so the library header stays one row. */
export function LibrarySavedViewsMenu({
  onUpdateActiveView,
  onSaveView,
}: LibrarySavedViewsMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Menu>
      <MenuTrigger
        className="btn btn-secondary library-saved-views-trigger"
        aria-label={t('savedViews.menuAria')}
      >
        <Bookmark size={16} strokeWidth={2} aria-hidden />
        <span className="library-saved-views-trigger-label">{t('savedViews.menuLabel')}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </MenuTrigger>
      <MenuContent className="popover-surface library-saved-views-menu" align="end">
        <MenuItem
          role="menuitem"
          icon={Save}
          label={t('savedViews.saveAction')}
          onClick={onSaveView}
        />
        {onUpdateActiveView ? (
          <MenuItem
            role="menuitem"
            icon={RefreshCw}
            label={t('savedViews.updateFromFilters')}
            onClick={onUpdateActiveView}
          />
        ) : null}
        <MenuItem
          role="menuitem"
          icon={Settings2}
          label={t('savedViews.manageNav')}
          onClick={() => {
            navigate(routes.savedViews);
          }}
        />
      </MenuContent>
    </Menu>
  );
}
