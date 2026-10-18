// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const MAX_FOLDER_DEPTH = 3;

export interface FolderDepthNode {
  id: string;
  parentId: string | null;
}

export function folderDepth(folders: FolderDepthNode[], folderId: string): number {
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

export function maxSubtreeDepth(folders: FolderDepthNode[], rootId: string): number {
  const childrenByParent = new Map<string | null, string[]>();
  for (const f of folders) {
    const key = f.parentId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(f.id);
    childrenByParent.set(key, list);
  }

  function walk(id: string, depth: number): number {
    let max = depth;
    for (const child of childrenByParent.get(id) ?? []) {
      max = Math.max(max, walk(child, depth + 1));
    }
    return max;
  }

  return walk(rootId, 1);
}

export function assertFolderDepthAllowed(
  folders: FolderDepthNode[],
  options: { parentId: string | null; folderId?: string }
): void {
  if (options.parentId) {
    const parentDepth = folderDepth(folders, options.parentId);
    if (parentDepth >= MAX_FOLDER_DEPTH) {
      throw new Error('FOLDER_MAX_DEPTH');
    }
    if (options.folderId) {
      const oldDepth = folderDepth(folders, options.folderId);
      const subtreeSpan = maxSubtreeDepth(folders, options.folderId) - oldDepth + 1;
      const newDepth = parentDepth + 1;
      if (newDepth + subtreeSpan - 1 > MAX_FOLDER_DEPTH) {
        throw new Error('FOLDER_MAX_DEPTH');
      }
    }
  }
}
