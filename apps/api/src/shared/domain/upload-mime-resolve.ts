// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { resolveUploadMime } from '@docuvate/contracts';

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

function isTiffMagic(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }
  const littleEndian =
    buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00;
  const bigEndian =
    buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a;
  return littleEndian || bigEndian;
}

function isWebpMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 && readAscii(buffer, 0, 4) === 'RIFF' && readAscii(buffer, 8, 4) === 'WEBP'
  );
}

function headerLine(head: string, name: string): boolean {
  const pattern = new RegExp(`^${name}:\\s+\\S`, 'm');
  return pattern.test(head);
}

/** RFC822 or mbox. A prose line that merely starts with "From" is not mail. */
function isRfc822Payload(buffer: Buffer): boolean {
  const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
  const evidence =
    headerLine(head, 'Subject') ||
    headerLine(head, 'Date') ||
    headerLine(head, 'To') ||
    headerLine(head, 'MIME-Version');
  if (!evidence) {
    return false;
  }
  if (headerLine(head, 'From')) {
    return true;
  }
  return head.startsWith('From ');
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

export function sniffUploadMime(payload: Uint8Array, filename: string): string | null {
  const buffer = Buffer.from(payload);
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
  if (isWebpMagic(buffer)) {
    return 'image/webp';
  }
  if (isTiffMagic(buffer)) {
    return 'image/tiff';
  }
  const ooxml = sniffOoxmlKind(buffer);
  if (ooxml) {
    return ooxml;
  }
  if (isOleMagic(buffer)) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.msg')) return 'application/vnd.ms-outlook';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
    return 'application/msword';
  }
  if (buffer.length >= 5 && readAscii(buffer, 0, 5) === '{\\rtf') {
    return 'application/rtf';
  }
  if (isRfc822Payload(buffer)) {
    return 'message/rfc822';
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
