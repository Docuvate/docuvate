// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const UNASSIGNED_FOLDER_DROP_ID = 'folder:__unassigned__';

export function documentDragId(documentId: string): string {
  return `document:${documentId}`;
}

export function folderDropId(folderId: string): string {
  return `folder:${folderId}`;
}

/** Parse droppable id; `null` = Ohne Ordner, `undefined` = not a folder target. */
export function parseFolderDropTargetId(id: string | number | null | undefined): string | null | undefined {
  if (id == null) return undefined;
  const key = String(id);
  if (key === UNASSIGNED_FOLDER_DROP_ID) return null;
  if (key.startsWith('folder:')) return key.slice('folder:'.length);
  return undefined;
}

export function isDocumentDragId(id: string | number | null | undefined): boolean {
  if (id == null) return false;
  return String(id).startsWith('document:');
}

export interface DocumentDragData {
  type: 'document';
  documentIds: string[];
  primaryDocumentId: string;
  label: string;
}
