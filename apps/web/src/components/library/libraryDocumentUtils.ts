// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';

export function showDocumentFilenameSubtitle(doc: DocumentDto): boolean {
  const title = doc.title.trim();
  return title.length > 0 && doc.filename.trim() !== title;
}

function resolveLocaleTag(locale: string): string {
  return locale.startsWith('de') ? 'de-DE' : 'en-US';
}

export type DocumentDateDisplayStyle = 'full' | 'table';

function formatLocaleDate(raw: string, locale: string, style: DocumentDateDisplayStyle): string {
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return raw;
  }
  const tag = resolveLocaleTag(locale);
  const hasTime = raw.includes('T');
  if (style === 'table') {
    return new Intl.DateTimeFormat(tag, { dateStyle: 'medium' }).format(new Date(parsed));
  }
  return new Intl.DateTimeFormat(tag, hasTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(
    new Date(parsed)
  );
}

export function documentDisplayDateParts(
  doc: Pick<DocumentDto, 'documentDate' | 'createdAt' | 'updatedAt'>,
  locale = 'de-DE',
  style: DocumentDateDisplayStyle = 'full'
): { text: string; isUploadFallback: boolean } {
  const isUploadFallback = !doc.documentDate;
  const raw = doc.documentDate ?? doc.createdAt;
  return {
    text: formatLocaleDate(raw, locale, style),
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

export function isStoredPdfPreview(doc: {
  mimeType: string;
  previewAvailable?: boolean;
}): boolean {
  return doc.previewAvailable === true && !isPdfMime(doc.mimeType);
}
