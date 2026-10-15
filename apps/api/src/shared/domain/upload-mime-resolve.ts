// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  isAllowedUploadMime,
  normalizeMimeType,
  resolveUploadMime,
} from '@docuvate/contracts';

function readAscii(buffer: Buffer, start: number, len: number): string {
  return buffer.subarray(start, start + len).toString('ascii');
}

function isZipMagic(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function isOleMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

function sniffOoxmlKind(buffer: Buffer): string | null {
  if (!isZipMagic(buffer)) {
    return null;
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192)).toString('utf8');
  if (sample.includes('word/')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (sample.includes('xl/')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (sample.includes('ppt/')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  if (sample.includes('mimetype') && sample.includes('opendocument.text')) {
    return 'application/vnd.oasis.opendocument.text';
  }
  if (sample.includes('mimetype') && sample.includes('opendocument.spreadsheet')) {
    return 'application/vnd.oasis.opendocument.spreadsheet';
  }
  if (sample.includes('mimetype') && sample.includes('opendocument.presentation')) {
    return 'application/vnd.oasis.opendocument.presentation';
  }
  return null;
}

export function sniffUploadMime(buffer: Buffer, filename: string): string | null {
  if (buffer.length >= 5 && readAscii(buffer, 0, 5) === '%PDF-') {
    return 'application/pdf';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && readAscii(buffer, 0, 4) === '\x89PNG') {
    return 'image/png';
  }
  if (buffer.length >= 4 && readAscii(buffer, 0, 4) === 'GIF8') {
    return 'image/gif';
  }
  const ooxml = sniffOoxmlKind(buffer);
  if (ooxml) {
    return ooxml;
  }
  if (isOleMagic(buffer)) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
    return 'application/msword';
  }
  if (buffer.length >= 5 && readAscii(buffer, 0, 5) === '{\\rtf') {
    return 'application/rtf';
  }
  if (buffer.length >= 4 && readAscii(buffer, 0, 4) === 'From') {
    return 'message/rfc822';
  }
  if (isOleMagic(buffer) && filename.toLowerCase().endsWith('.msg')) {
    return 'application/vnd.ms-outlook';
  }
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString('utf8').trimStart();
  if (head.startsWith('<!DOCTYPE') || head.startsWith('<html') || head.startsWith('<HTML')) {
    return 'text/html';
  }
  return null;
}

export function resolveAllowedUploadMime(
  filename: string,
  declaredMime: string,
  buffer: Buffer
): string | null {
  return resolveUploadMime(filename, declaredMime, buffer, sniffUploadMime);
}

export function assertAllowedUploadMime(
  filename: string,
  declaredMime: string,
  buffer: Buffer
): string {
  const resolved = resolveAllowedUploadMime(filename, declaredMime, buffer);
  if (!resolved) {
    throw new Error('UNSUPPORTED_UPLOAD_TYPE');
  }
  const normalized = normalizeMimeType(resolved);
  if (!isAllowedUploadMime(normalized)) {
    throw new Error('UNSUPPORTED_UPLOAD_TYPE');
  }
  return normalized;
}
