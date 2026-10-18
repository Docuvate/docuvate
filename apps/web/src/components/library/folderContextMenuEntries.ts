// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentBulkAction, FolderDto } from '@docuvate/contracts';
import type { TFunction } from 'i18next';

import { childFolders } from '../../lib/ordnerTree';
import type { ContextMenuEntry } from '../ui/ContextMenu';

function folderNodeToMenuEntry(
  folder: FolderDto,
  folders: FolderDto[],
  onRunBulk: (action: DocumentBulkAction) => void
): ContextMenuEntry {
  const children = childFolders(folders, folder.id);
  if (children.length === 0) {
    return {
      kind: 'item',
      id: `folder-${folder.id}`,
      label: folder.name,
      onSelect: () => { onRunBulk({ action: 'setFolder', folderId: folder.id }); },
    };
  }

  return {
    kind: 'submenu',
    id: `folder-${folder.id}`,
    label: folder.name,
    onSelectParent: () => { onRunBulk({ action: 'setFolder', folderId: folder.id }); },
    items: children.map((child) => folderNodeToMenuEntry(child, folders, onRunBulk)),
  };
}

export function buildFolderContextMenuEntries(
  folders: FolderDto[],
  onRunBulk: (action: DocumentBulkAction) => void,
  t: TFunction
): ContextMenuEntry[] {
  const entries: ContextMenuEntry[] = [
    {
      kind: 'item',
      id: 'folder-none',
      label: t('library.contextNoFolder'),
      onSelect: () => { onRunBulk({ action: 'setFolder', folderId: null }); },
    },
  ];

  for (const folder of childFolders(folders, null)) {
    entries.push(folderNodeToMenuEntry(folder, folders, onRunBulk));
  }

  return entries;
}
