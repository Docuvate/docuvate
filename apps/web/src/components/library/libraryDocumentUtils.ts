// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

export function showDocumentFilenameSubtitle(doc: DocumentDto): boolean {
  const title = doc.title.trim();
  return title.length > 0 && doc.filename.trim() !== title;
}

export function documentDisplayDate(doc: DocumentDto): string {
  const raw = doc.documentDate ?? doc.updatedAt;
  return new Date(raw).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdfMime(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
