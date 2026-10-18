// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { childFolders, folderDirectDocumentCount, folderHref } from '../../lib/ordnerTree';
import { DateisystemRootEmptyState } from './DateisystemRootEmptyState';

interface DateisystemRootOverviewProps {
  folders: FolderDto[];
  onCreateRoot: () => void;
}

export function DateisystemRootOverview({ folders, onCreateRoot }: DateisystemRootOverviewProps) {
  const { t } = useTranslation();
  const roots = childFolders(folders, null);

  return (
    <div className="dateisystem-root-overview">
      <p className="muted dateisystem-root-overview-lead">{t('filesystem.allFoldersHint')}</p>
      {roots.length === 0 ? (
        <DateisystemRootEmptyState onCreateRoot={onCreateRoot} />
      ) : (
        <ul className="dateisystem-root-folder-list">
          {roots.map((folder) => {
            const childCount = childFolders(folders, folder.id).length;
            const docCount = folderDirectDocumentCount(folder);
            return (
              <li key={folder.id}>
                <Link to={folderHref(folder.id)} className="dateisystem-root-folder-card">
                  <span className="dateisystem-root-folder-name">{folder.name}</span>
                  <span className="muted dateisystem-root-folder-meta">
                    {t('library.folderDocCount', { count: docCount })}
                    {' · '}
                    {t('library.subfolderCount', { count: childCount })}
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
