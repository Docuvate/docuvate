// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const DOCUMENT_DND_MIME = 'application/x-docuvate-document-id';

export function isDocumentDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return [...dataTransfer.types].includes(DOCUMENT_DND_MIME);
}
