// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface FolderParentNode {
  id: string;
  parentId: string | null;
}

/** True when assigning `newParentId` would make `folderId` an ancestor of itself. */
export function wouldCreateFolderCycle(
  folders: FolderParentNode[],
  folderId: string,
  newParentId: string | null
): boolean {
  if (newParentId === null) {
    return false;
  }
  if (newParentId === folderId) {
    return true;
  }
  const byId = new Map(folders.map((f) => [f.id, f]));
  let current: string | null = newParentId;
  while (current) {
    if (current === folderId) {
      return true;
    }
    current = byId.get(current)?.parentId ?? null;
  }
  return false;
}
