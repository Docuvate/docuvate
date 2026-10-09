// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const TEMP_SUFFIXES = ['.tmp', '.part', '.partial', '~'];

export function isTemporaryScanFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return TEMP_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

export type AllowedScanMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/tiff';

export interface ScanFileValidationResult {
  ok: true;
  mimeType: AllowedScanMime;
  filename: string;
}

export interface ScanFileValidationFailure {
  ok: false;
  reasonKey: string;
}

export type ScanFileValidation = ScanFileValidationResult | ScanFileValidationFailure;

function detectMime(buffer: Buffer): AllowedScanMime | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 4 &&
    (buffer.subarray(0, 4).toString('ascii') === 'II*\x00' ||
      buffer.subarray(0, 4).toString('ascii') === 'MM\x00*')
  ) {
    return 'image/tiff';
  }
  return null;
}

export function validateScanFile(
  filename: string,
  buffer: Buffer,
  maxBytes: number
): ScanFileValidation {
  const trimmed = filename.trim();
  if (!trimmed) {
    return { ok: false, reasonKey: 'sftpIngress.errors.emptyFilename' };
  }
  if (isTemporaryScanFilename(trimmed)) {
    return { ok: false, reasonKey: 'sftpIngress.errors.temporaryFilename' };
  }
  if (buffer.length === 0) {
    return { ok: false, reasonKey: 'sftpIngress.errors.emptyFile' };
  }
  if (buffer.length > maxBytes) {
    return { ok: false, reasonKey: 'sftpIngress.errors.fileTooLarge' };
  }
  const mimeType = detectMime(buffer);
  if (!mimeType) {
    return { ok: false, reasonKey: 'sftpIngress.errors.unsupportedType' };
  }
  return { ok: true, mimeType, filename: trimmed };
}
