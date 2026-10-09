// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/gif,image/tiff';

const UPLOAD_MIME_PREFIXES = ['image/'] as const;
const UPLOAD_MIME_EXACT = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
]);

export function isAllowedUploadMime(mime: string): boolean {
  if (UPLOAD_MIME_EXACT.has(mime)) return true;
  return UPLOAD_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

export function isFileDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return [...dataTransfer.types].includes('Files');
}
