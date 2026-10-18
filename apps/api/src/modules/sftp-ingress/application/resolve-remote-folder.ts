// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderListItem } from '../../../shared/domain/ports.js';

export function resolveFolderFromRemotePath(
  folders: FolderListItem[],
  baseFolderId: string | null,
  remotePath: string,
  mapSubfolders: boolean
): string | null {
  if (!mapSubfolders) {
    return baseFolderId;
  }
  const normalized = remotePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return baseFolderId;
  }
  const folderSegments = segments.slice(0, -1);
  let parentId = baseFolderId;
  for (const segment of folderSegments) {
    const match = folders.find(
      (f) =>
        f.name.toLowerCase() === segment.toLowerCase() &&
        (parentId == null ? f.parentId == null : f.parentId === parentId)
    );
    if (!match) {
      return baseFolderId;
    }
    parentId = match.id;
  }
  return parentId;
}
