// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';

export const MAX_FOLDER_DEPTH = 3;

export function folderDepthNodes(folders: FolderDto[]): { id: string; parentId: string | null }[] {
  return folders.map((f) => ({ id: f.id, parentId: f.parentId ?? null }));
}

export function folderDepth(folders: FolderDto[], folderId: string): number {
  const byId = new Map(folders.map((f) => [f.id, f]));
  let depth = 0;
  let current: string | null = folderId;
  while (current) {
    depth++;
    const node = byId.get(current);
    if (!node?.parentId) break;
    current = node.parentId;
  }
  return depth;
}

export function canCreateChildFolder(folders: FolderDto[], parentId: string | null): boolean {
  if (!parentId) return true;
  return folderDepth(folders, parentId) < MAX_FOLDER_DEPTH;
}
