// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import type { TFunction } from 'i18next';

import { formatFileSize } from './formatFileSize';

export function documentPageCount(doc: DocumentDto): number | null {
  const pages = doc.extraction?.layoutIrPages;
  if (pages && pages.length > 0) {
    return pages.length;
  }
  return null;
}

export function documentFormatLabel(doc: DocumentDto): string {
  if (doc.formatBadge?.trim()) {
    return doc.formatBadge.trim();
  }
  const mime = doc.mimeType.trim();
  if (mime === 'application/pdf') {
    return 'PDF';
  }
  if (mime.startsWith('image/')) {
    return mime.slice('image/'.length).toUpperCase();
  }
  return mime;
}

export function documentIngestSourceLabel(
  ingestSource: string | null | undefined,
  t: TFunction
): string {
  if (ingestSource === 'scanner_sftp') {
    return t('documents.ingestSourceScanner');
  }
  if (ingestSource === 'paperless') {
    return t('documents.ingestSourcePaperless');
  }
  if (ingestSource === 'mail') {
    return t('documents.ingestSourceMail');
  }
  return t('documents.ingestSourceUpload');
}

export function formatDocumentMetadataFileSummary(
  doc: DocumentDto,
  t: TFunction,
  locale: string
): string {
  const parts: string[] = [doc.filename.trim() || doc.title.trim() || doc.id];
  const format = documentFormatLabel(doc);
  const pageCount = documentPageCount(doc);
  const sizeLabel = formatFileSize(doc.fileSizeBytes, locale);
  if (pageCount != null) {
    parts.push(
      t('documents.metadataFileFormatPagesSize', { format, count: pageCount, size: sizeLabel })
    );
  } else {
    parts.push(t('documents.metadataFileFormatSize', { format, size: sizeLabel }));
  }
  parts.push(documentIngestSourceLabel(doc.ingestSource, t));
  const uploaded = Date.parse(doc.createdAt);
  if (!Number.isNaN(uploaded)) {
    parts.push(
      t('documents.metadataFileUploaded', {
        date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(uploaded)),
      })
    );
  }
  return parts.join(' · ');
}
