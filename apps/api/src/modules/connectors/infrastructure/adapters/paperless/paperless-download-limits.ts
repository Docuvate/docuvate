// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Matches Nest multipart limit in `main.ts` (Docuvate document upload cap). */
export const DOCUVATE_DOCUMENT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

const TWO_HUNDRED_MEBIBYTES = 200 * 1024 * 1024;

function defaultPaperlessMaxDownloadBytes(): number {
  return DOCUVATE_DOCUMENT_UPLOAD_MAX_BYTES < TWO_HUNDRED_MEBIBYTES
    ? TWO_HUNDRED_MEBIBYTES
    : DOCUVATE_DOCUMENT_UPLOAD_MAX_BYTES;
}

/** Streaming download cap for Paperless connector fetches (SSRF / memory guard). */
export function readPaperlessMaxDownloadBytes(): number {
  const raw = process.env['DOCUVATE_PAPERLESS_MAX_DOWNLOAD_BYTES'];
  if (raw === undefined || raw.trim() === '') {
    return defaultPaperlessMaxDownloadBytes();
  }
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultPaperlessMaxDownloadBytes();
  }
  return Math.floor(parsed);
}

export function paperlessMaxDownloadMegabytes(maxBytes: number): number {
  return Math.round(maxBytes / (1024 * 1024));
}
