// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveAllowedUploadMime, sniffUploadMime } from './upload-mime-resolve.js';

describe('upload-mime-resolve', () => {
  it('sniffs docx zip payload', () => {
    const buf = Buffer.from('PK\x03\x04word/document.xml', 'utf8');
    expect(sniffUploadMime(buf, 'memo.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('resolves allowed mime from extension when browser sends octet-stream', () => {
    const mime = resolveAllowedUploadMime(
      'report.csv',
      'application/octet-stream',
      Buffer.from('a,b\n1,2')
    );
    expect(mime).toBe('text/csv');
  });

  it('sniffs an OLE .msg as Outlook mail instead of Word', () => {
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0]);
    expect(sniffUploadMime(ole, 'inbox.msg')).toBe('application/vnd.ms-outlook');
    expect(sniffUploadMime(ole, 'memo.doc')).toBe('application/msword');
  });

  it('sniffs TIFF and WebP bytes when the filename has no known extension', () => {
    const tiff = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0, 0, 0, 0]);
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(resolveAllowedUploadMime('scan.bin', 'application/octet-stream', tiff)).toBe(
      'image/tiff'
    );
    expect(resolveAllowedUploadMime('photo.bin', 'application/octet-stream', webp)).toBe(
      'image/webp'
    );
  });

  it('does not treat prose that starts with From as an email', () => {
    const lyrics = Buffer.from('From the hills we came\nwith a pot of stew\n', 'utf8');
    expect(sniffUploadMime(lyrics, 'lyrics.bin')).toBeNull();
    expect(resolveAllowedUploadMime('lyrics.txt', 'application/octet-stream', lyrics)).toBe(
      'text/plain'
    );
  });

  it('sniffs a real RFC822 header block as email', () => {
    const eml = Buffer.from('From: cook@example.test\nSubject: Sunday stew\n\nSimmer.\n', 'utf8');
    expect(sniffUploadMime(eml, 'message.bin')).toBe('message/rfc822');
  });
});
