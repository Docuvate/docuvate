// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeMimeType } from '@docuvate/contracts';

import { resolveAllowedUploadMime } from '../../../shared/domain/upload-mime-resolve.js';

const TEMP_SUFFIXES = ['.tmp', '.part', '.partial', '~'];

export function isTemporaryScanFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return TEMP_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

export interface ScanFileValidationResult {
  ok: true;
  mimeType: string;
  filename: string;
}

export interface ScanFileValidationFailure {
  ok: false;
  reasonKey: string;
}

export type ScanFileValidation = ScanFileValidationResult | ScanFileValidationFailure;

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
  const resolved = resolveAllowedUploadMime(trimmed, '', buffer);
  if (!resolved) {
    return { ok: false, reasonKey: 'sftpIngress.errors.unsupportedType' };
  }
  return { ok: true, mimeType: normalizeMimeType(resolved), filename: trimmed };
}
