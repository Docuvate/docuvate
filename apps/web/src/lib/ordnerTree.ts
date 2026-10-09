// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import i18n from '../i18n';
import { routes } from './routes';

export type OrdnerSelection =
  { kind: 'root' } | { kind: 'mappe'; mappeId: string } | { kind: 'folder'; folderId: string };

export interface OrdnerBreadcrumbSegment {
  label: string;
  to: string;
}

export function sortByNameDe<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** Direct child folders under a mappe root or nested parent. */
export function childFolders(
  folders: FolderDto[],
  options: { mappeId: string; parentId: string | null }
): FolderDto[] {
  return sortByNameDe(
    folders.filter((f) => {
      if (f.mappeId !== options.mappeId) return false;
      const pid = f.parentId ?? null;
      return pid === options.parentId;
    })
  );
}

export function foldersWithoutMappe(folders: FolderDto[]): FolderDto[] {
  return sortByNameDe(folders.filter((f) => !f.mappeId && !f.parentId));
}

export function orphanNestedFolders(folders: FolderDto[]): FolderDto[] {
  return sortByNameDe(folders.filter((f) => !f.mappeId && f.parentId));
}

export function findMappe(mappen: MappeDto[], id: string): MappeDto | undefined {
  return mappen.find((m) => m.id === id);
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
  mappen: MappeDto[],
  folders: FolderDto[],
  selection: OrdnerSelection
): OrdnerBreadcrumbSegment[] {
  const folderFallback = i18n.t('common.folder');
  const root: OrdnerBreadcrumbSegment = {
    label: i18n.t('nav.folders'),
    to: routes.filesystem,
  };
  if (selection.kind === 'root') return [root];

  if (selection.kind === 'mappe') {
    const m = findMappe(mappen, selection.mappeId);
    return [
      root,
      {
        label: m?.name ?? folderFallback,
        to: routes.filesystemContainer(selection.mappeId),
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
  const mappeId = chain[0]?.mappeId;
  if (mappeId) {
    const m = findMappe(mappen, mappeId);
    segments.push({
      label: m?.name ?? folderFallback,
      to: routes.filesystemContainer(mappeId),
    });
  }
  for (const folder of chain) {
    segments.push({ label: folder.name, to: routes.filesystemFolder(folder.id) });
  }
  return segments;
}

export function mappeHref(mappeId: string): string {
  return routes.filesystemContainer(mappeId);
}

export function folderHref(folderId: string): string {
  return routes.filesystemFolder(folderId);
}

export function nodeMatchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q);
}

/** True if this node or any descendant matches the search query. */
export function mappeSubtreeMatchesSearch(
  folders: FolderDto[],
  mappeId: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  function walk(parentId: string | null): boolean {
    const children = childFolders(folders, { mappeId, parentId });
    for (const child of children) {
      if (nodeMatchesQuery(child.name, q)) return true;
      if (walk(child.id)) return true;
    }
    return false;
  }

  return walk(null);
}

/** First folder or container href when entering filesystem root. */
export function pickDefaultFilesystemHref(mappen: MappeDto[], folders: FolderDto[]): string | null {
  const sorted = sortByNameDe(mappen);
  for (const mappe of sorted) {
    const roots = childFolders(folders, { mappeId: mappe.id, parentId: null });
    if (roots.length > 0) {
      return folderHref(roots[0]!.id);
    }
    return mappeHref(mappe.id);
  }
  const loose = foldersWithoutMappe(folders);
  if (loose.length > 0) {
    return folderHref(loose[0]!.id);
  }
  return null;
}

/** Documents stored directly in this folder (API: folder_id match only). */
export function folderDirectDocumentCount(folder: FolderDto): number {
  return folder.documentCount ?? 0;
}

/** API aggregate: documents in the mappe plus all nested folders. */
export function mappeDocumentCount(mappe: MappeDto): number {
  return mappe.documentCount ?? 0;
}

/** Documents assigned to the mappe container only (not inside a folder). */
export function mappeDirectDocumentCount(mappe: MappeDto, folders: FolderDto[]): number {
  const inFolders = folders
    .filter((f) => f.mappeId === mappe.id)
    .reduce((sum, f) => sum + folderDirectDocumentCount(f), 0);
  return Math.max(0, mappeDocumentCount(mappe) - inFolders);
}

export function folderSubtreeMatchesSearch(
  folders: FolderDto[],
  folder: FolderDto,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (nodeMatchesQuery(folder.name, q)) return true;
  if (!folder.mappeId) return false;

  function walk(parentId: string): boolean {
    const children = childFolders(folders, { mappeId: folder.mappeId!, parentId });
    for (const child of children) {
      if (nodeMatchesQuery(child.name, q)) return true;
      if (walk(child.id)) return true;
    }
    return false;
  }

  return walk(folder.id);
}
