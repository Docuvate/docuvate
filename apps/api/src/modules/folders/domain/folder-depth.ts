// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
interface FolderDepthNode {
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
