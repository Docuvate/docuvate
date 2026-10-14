// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

export function showDocumentFilenameSubtitle(doc: DocumentDto): boolean {
  const title = doc.title.trim();
  return title.length > 0 && doc.filename.trim() !== title;
}

export function documentDisplayDateParts(
  doc: Pick<DocumentDto, 'documentDate' | 'createdAt' | 'updatedAt'>,
  locale = 'de-DE'
): { text: string; isUploadFallback: boolean } {
  const isUploadFallback = !doc.documentDate;
  const raw = doc.documentDate ?? doc.createdAt ?? doc.updatedAt;
  return {
    text: new Date(raw).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    isUploadFallback,
  };
}

export function documentDisplayDate(
  doc: Pick<DocumentDto, 'documentDate' | 'createdAt' | 'updatedAt'>,
  locale = 'de-DE'
): string {
  return documentDisplayDateParts(doc, locale).text;
}

export function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdfMime(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
