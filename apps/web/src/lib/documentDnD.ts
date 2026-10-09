// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const DOCUMENT_DND_MIME = 'application/x-docuvate-document-id';

export function setDocumentDragData(dataTransfer: DataTransfer, documentId: string): void {
  dataTransfer.setData(DOCUMENT_DND_MIME, documentId);
  dataTransfer.effectAllowed = 'move';
}

export function readDocumentDragIds(dataTransfer: DataTransfer | null): string[] {
  if (!dataTransfer) return [];
  const raw = dataTransfer.getData(DOCUMENT_DND_MIME);
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
}

export function isDocumentDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return [...dataTransfer.types].includes(DOCUMENT_DND_MIME);
}
