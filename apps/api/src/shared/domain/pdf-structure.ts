// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Cheap structural checks before enqueueing OCR. Rejects `%PDF-` stubs and
 * truncated payloads that would otherwise return HTTP 201 and fail later.
 */
export function isStructurallyValidPdf(buffer: Buffer): boolean {
  if (buffer.length < 64) {
    return false;
  }
  const header = buffer.subarray(0, 8).toString('latin1');
  if (!header.startsWith('%PDF-')) {
    return false;
  }
  const tailStart = Math.max(0, buffer.length - 2048);
  const tail = buffer.subarray(tailStart).toString('latin1');
  if (!tail.includes('%%EOF')) {
    return false;
  }
  const scanEnd = Math.min(buffer.length, 256 * 1024);
  const body = buffer.subarray(0, scanEnd).toString('latin1');
  return /\d+\s+\d+\s+obj/.test(body) && body.includes('startxref');
}
