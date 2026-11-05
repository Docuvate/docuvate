// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  type FolderDocumentCounts,
  folderDocumentCountsFor,
  folderHref,
} from '../../lib/ordnerTree';
import { useFolderDropTarget } from './DocumentFolderDnD';

interface FilesystemChildFoldersSectionProps {
  folders: FolderDto[];
  /** Counts for all folders, including subfolders (see folderDocumentCountsWithSubfolders). */
  documentCounts: ReadonlyMap<string, FolderDocumentCounts>;
}

function FolderTile({
  folder,
  documentCounts,
}: {
  folder: FolderDto;
  documentCounts: ReadonlyMap<string, FolderDocumentCounts>;
}) {
  const { t } = useTranslation();
  const { setNodeRef, highlighted } = useFolderDropTarget({
    folderId: folder.id,
    folderName: folder.name,
  });
  const { total: count, direct } = folderDocumentCountsFor(documentCounts, folder);

  return (
    <li
      ref={setNodeRef}
      className={`filesystem-folder-tile-wrap${highlighted ? ' drop-target' : ''}`}
    >
      <Link
        to={folderHref(folder.id)}
        className="filesystem-folder-tile"
        title={t('filesystem.folderDocCountTooltip', { count, direct })}
      >
        <Folder size={18} strokeWidth={1.75} aria-hidden className="filesystem-folder-tile-icon" />
        <span className="filesystem-folder-tile-name">{folder.name}</span>
        <span className="filesystem-folder-tile-count" aria-label={t('library.folderDocCount', { count })}>
          {count}
        </span>
      </Link>
    </li>
  );
}

export function FilesystemChildFoldersSection({
  folders,
  documentCounts,
}: FilesystemChildFoldersSectionProps) {
  const { t } = useTranslation();
  if (folders.length === 0) return null;

  return (
    <section className="filesystem-child-folders" aria-label={t('filesystem.foldersSection')}>
      <h2 className="filesystem-child-folders-title">{t('filesystem.foldersSection')}</h2>
      <ul className="filesystem-folder-tile-grid">
        {folders.map((folder) => (
          <FolderTile key={folder.id} folder={folder} documentCounts={documentCounts} />
        ))}
      </ul>
    </section>
  );
}
