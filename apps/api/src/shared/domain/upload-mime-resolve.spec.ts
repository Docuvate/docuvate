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
    const mime = resolveAllowedUploadMime('report.csv', 'application/octet-stream', Buffer.from('a,b\n1,2'));
    expect(mime).toBe('text/csv');
  });
});
