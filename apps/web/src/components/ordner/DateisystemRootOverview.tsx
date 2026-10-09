// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import { mappeHref, sortByNameDe } from '../../lib/ordnerTree';
import { Button } from '../ui/Button';

interface DateisystemRootOverviewProps {
  mappen: MappeDto[];
  folders: FolderDto[];
  onCreateRoot: () => void;
}

export function DateisystemRootOverview({
  mappen,
  folders,
  onCreateRoot,
}: DateisystemRootOverviewProps) {
  const { t } = useTranslation();
  const sorted = sortByNameDe(mappen);

  return (
    <div className="dateisystem-root-overview">
      <h3>{t('filesystem.allFoldersTitle')}</h3>
      <p className="muted">{t('filesystem.allFoldersHint')}</p>
      {sorted.length === 0 ? (
        <div className="empty-state dateisystem-root-empty">
          <p className="muted">{t('filesystem.rootEmpty')}</p>
          <Button type="button" variant="primary" onClick={onCreateRoot}>
            {t('filesystem.newRootButton')}
          </Button>
        </div>
      ) : (
        <ul className="dateisystem-root-mappen-list">
          {sorted.map((mappe) => {
            const folderCount = folders.filter((f) => f.mappeId === mappe.id).length;
            return (
              <li key={mappe.id}>
                <Link to={mappeHref(mappe.id)} className="dateisystem-root-mappe-card">
                  <span className="dateisystem-root-mappe-name">{mappe.name}</span>
                  <span className="muted dateisystem-root-mappe-meta">
                    {t('library.mappeDocCount', { count: mappe.documentCount ?? 0 })}
                    {' · '}
                    {t('library.mappeFolderCount', { count: folderCount })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
