import type { TFunction } from 'i18next';
import type { DocumentBulkAction, FolderDto, MappeDto } from '@docuvate/contracts';
import type { ContextMenuEntry } from '../ui/ContextMenu';
import { childFolders, sortByNameDe } from '../../lib/ordnerTree';

function folderAssignTargetId(mappe: MappeDto, folders: FolderDto[]): string | null {
  const inMappe = folders.filter((folder) => folder.mappeId === mappe.id);
  if (inMappe.length === 1) {
    return inMappe[0]!.id;
  }
  const roots = childFolders(folders, { mappeId: mappe.id, parentId: null });
  if (roots.length === 1) {
    return roots[0]!.id;
  }
  const byName = roots.find((folder) => folder.name === mappe.name);
  return byName?.id ?? null;
}

function folderNodeToMenuEntry(
  folder: FolderDto,
  folders: FolderDto[],
  onRunBulk: (action: DocumentBulkAction) => void
): ContextMenuEntry {
  if (!folder.mappeId) {
    return {
      kind: 'item',
      id: `folder-${folder.id}`,
      label: folder.name,
      onSelect: () => onRunBulk({ action: 'setFolder', folderId: folder.id }),
    };
  }

  const children = childFolders(folders, { mappeId: folder.mappeId, parentId: folder.id });
  if (children.length === 0) {
    return {
      kind: 'item',
      id: `folder-${folder.id}`,
      label: folder.name,
      onSelect: () => onRunBulk({ action: 'setFolder', folderId: folder.id }),
    };
  }

  return {
    kind: 'submenu',
    id: `folder-${folder.id}`,
    label: folder.name,
    onSelectParent: () => onRunBulk({ action: 'setFolder', folderId: folder.id }),
    items: children.map((child) => folderNodeToMenuEntry(child, folders, onRunBulk)),
  };
}

export function buildFolderContextMenuEntries(
  folders: FolderDto[],
  mappen: MappeDto[],
  onRunBulk: (action: DocumentBulkAction) => void,
  t: TFunction
): ContextMenuEntry[] {
  const entries: ContextMenuEntry[] = [
    {
      kind: 'item',
      id: 'folder-none',
      label: t('library.contextNoFolder'),
      onSelect: () => onRunBulk({ action: 'setFolder', folderId: null }),
    },
  ];

  for (const mappe of sortByNameDe(mappen)) {
    const roots = childFolders(folders, { mappeId: mappe.id, parentId: null });
    if (roots.length === 0) {
      continue;
    }

    const assignTargetId = folderAssignTargetId(mappe, folders);
    const childItems = roots.map((folder) => folderNodeToMenuEntry(folder, folders, onRunBulk));

    if (roots.length === 1 && roots[0]!.name === mappe.name && childItems.length === 1) {
      entries.push(childItems[0]!);
      continue;
    }

    entries.push({
      kind: 'submenu',
      id: `mappe-${mappe.id}`,
      label: mappe.name,
      onSelectParent: assignTargetId
        ? () => onRunBulk({ action: 'setFolder', folderId: assignTargetId })
        : undefined,
      items: childItems,
    });
  }

  const unassigned = sortByNameDe(folders.filter((f) => !f.mappeId && !f.parentId));
  for (const folder of unassigned) {
    entries.push(folderNodeToMenuEntry(folder, folders, onRunBulk));
  }

  const orphanNested = sortByNameDe(folders.filter((f) => !f.mappeId && f.parentId));
  for (const folder of orphanNested) {
    entries.push(folderNodeToMenuEntry(folder, folders, onRunBulk));
  }

  return entries;
}
