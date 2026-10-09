// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const bufferByDocumentId = new Map<string, ArrayBuffer>();

export async function fetchDocumentPreviewBuffer(
  documentId: string,
  fetchBlob: () => Promise<Blob>
): Promise<ArrayBuffer> {
  const cached = bufferByDocumentId.get(documentId);
  if (cached) return cached;
  const blob = await fetchBlob();
  const buffer = await blob.arrayBuffer();
  bufferByDocumentId.set(documentId, buffer);
  return buffer;
}

export function clearDocumentPreviewCache(documentId?: string): void {
  if (documentId) {
    bufferByDocumentId.delete(documentId);
    return;
  }
  bufferByDocumentId.clear();
}
