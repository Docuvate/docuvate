// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';

import {
  childFolders,
  folderSubtreeMatchesSearch,
  isDescendant,
  nodeMatchesQuery,
} from '../ordnerTree';

export interface FlatFolderTreeRow {
  folder: FolderDto;
  depth: number;
  folderKey: string;
  open: boolean;
  hasChildren: boolean;
  active: boolean;
}

function resolveFolderOpen(
  folderKey: string,
  expanded: Set<string>,
  defaultOpen: boolean
): boolean {
  if (expanded.has(folderKey)) {
    return true;
  }
  if (expanded.has(`!${folderKey}`)) {
    return false;
  }
  return defaultOpen;
}

export function collectVisibleFolderTreeRows(options: {
  folders: FolderDto[];
  parentId: string | null;
  depth: number;
  treeQuery: string;
  selectionFolderId?: string;
  expanded: Set<string>;
}): FlatFolderTreeRow[] {
  const { folders, parentId, depth, treeQuery, selectionFolderId, expanded } = options;
  const nodes = childFolders(folders, parentId);
  const rows: FlatFolderTreeRow[] = [];

  for (const folder of nodes) {
    if (
      !nodeMatchesQuery(folder.name, treeQuery) &&
      !folderSubtreeMatchesSearch(folders, folder.id, treeQuery)
    ) {
      continue;
    }

    const children = childFolders(folders, folder.id);
    const folderKey = `f:${folder.id}`;
    const onPath =
      selectionFolderId === folder.id ||
      (selectionFolderId != null && isDescendant(folders, selectionFolderId, folder.id));
    const defaultOpen = onPath || folderSubtreeMatchesSearch(folders, folder.id, treeQuery);
    const open = resolveFolderOpen(folderKey, expanded, defaultOpen);
    const active = selectionFolderId === folder.id;

    rows.push({
      folder,
      depth,
      folderKey,
      open,
      hasChildren: children.length > 0,
      active,
    });

    if (open && children.length > 0) {
      rows.push(
        ...collectVisibleFolderTreeRows({
          folders,
          parentId: folder.id,
          depth: depth + 1,
          treeQuery,
          selectionFolderId,
          expanded,
        })
      );
    }
  }

  return rows;
}
