// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import {
  DOCUVATE_DOCUMENT_UPLOAD_MAX_BYTES,
  paperlessMaxDownloadMegabytes,
  readPaperlessMaxDownloadBytes,
} from './paperless-download-limits.js';

describe('paperless-download-limits', () => {
  afterEach(() => {
    delete process.env['DOCUVATE_PAPERLESS_MAX_DOWNLOAD_BYTES'];
  });

  it('defaults to 200 MiB when Docuvate upload cap is below 200 MiB', () => {
    expect(DOCUVATE_DOCUMENT_UPLOAD_MAX_BYTES).toBeLessThan(200 * 1024 * 1024);
    expect(readPaperlessMaxDownloadBytes()).toBe(200 * 1024 * 1024);
  });

  it('reads DOCUVATE_PAPERLESS_MAX_DOWNLOAD_BYTES when set', () => {
    process.env['DOCUVATE_PAPERLESS_MAX_DOWNLOAD_BYTES'] = '104857600';
    expect(readPaperlessMaxDownloadBytes()).toBe(104_857_600);
  });

  it('converts bytes to megabytes for UI copy', () => {
    expect(paperlessMaxDownloadMegabytes(200 * 1024 * 1024)).toBe(200);
  });
});
