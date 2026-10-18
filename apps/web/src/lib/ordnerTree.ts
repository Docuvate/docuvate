// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';

import i18n from '../i18n';
import { routes } from './routes';

export type OrdnerSelection =
  | { kind: 'root' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'unassigned' };

export interface OrdnerBreadcrumbSegment {
  label: string;
  to: string;
}

export function sortByNameDe<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Direct child folders under a parent (null = workspace root). */
export function childFolders(folders: FolderDto[], parentId: string | null): FolderDto[] {
  return sortByNameDe(
    folders.filter((f) => (f.parentId ?? null) === parentId)
  );
}

export function findFolder(folders: FolderDto[], id: string): FolderDto | undefined {
  return folders.find((f) => f.id === id);
}

export function folderAncestorChain(folders: FolderDto[], folderId: string): FolderDto[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const chain: FolderDto[] = [];
  let current = byId.get(folderId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return chain;
}

export function buildOrdnerBreadcrumbs(
  folders: FolderDto[],
  selection: OrdnerSelection
): OrdnerBreadcrumbSegment[] {
  const folderFallback = i18n.t('common.folder');
  const root: OrdnerBreadcrumbSegment = {
    label: i18n.t('filesystem.allFoldersTitle'),
    to: routes.filesystem,
  };
  if (selection.kind === 'root') return [root];

  if (selection.kind === 'unassigned') {
    return [
      root,
      {
        label: i18n.t('filesystem.withoutFolder'),
        to: routes.filesystemUnassigned,
      },
    ];
  }

  const chain = folderAncestorChain(folders, selection.folderId);
  if (chain.length === 0) {
    return [
      root,
      {
        label: folderFallback,
        to: routes.filesystemFolder(selection.folderId),
      },
    ];
  }

  const segments: OrdnerBreadcrumbSegment[] = [root];
  for (const folder of chain) {
    segments.push({ label: folder.name, to: routes.filesystemFolder(folder.id) });
  }
  return segments;
}

export function folderHref(folderId: string): string {
  return routes.filesystemFolder(folderId);
}

export function nodeMatchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

/** True if this folder or any descendant matches the search query. */
export function folderSubtreeMatchesSearch(
  folders: FolderDto[],
  folderId: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const folder = findFolder(folders, folderId);
  if (!folder) return false;
  if (nodeMatchesQuery(folder.name, q)) return true;

  function walk(parentId: string): boolean {
    const children = childFolders(folders, parentId);
    for (const child of children) {
      if (nodeMatchesQuery(child.name, q)) return true;
      if (walk(child.id)) return true;
    }
    return false;
  }

  return walk(folder.id);
}

/** First folder href when entering filesystem root (skip unassigned). */
export function pickDefaultFilesystemHref(folders: FolderDto[]): string | null {
  const roots = childFolders(folders, null);
  if (roots.length > 0) {
    return folderHref(roots[0].id);
  }
  return null;
}

/** Documents stored directly in this folder (API: folder_id match only). */
export function folderDirectDocumentCount(folder: FolderDto): number {
  return folder.documentCount ?? 0;
}

export function isDescendant(folders: FolderDto[], maybeDescendantId: string, ancestorId: string): boolean {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let current = byId.get(maybeDescendantId);
  while (current) {
    if (current.id === ancestorId) return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}
