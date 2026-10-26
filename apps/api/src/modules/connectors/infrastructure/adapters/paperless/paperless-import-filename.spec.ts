// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolvePaperlessImportFilename } from './paperless-import-filename.js';

describe('resolvePaperlessImportFilename', () => {
  it('uses original_file_name when present', () => {
    expect(
      resolvePaperlessImportFilename({
        id: 1,
        title: 'Invoice',
        original_file_name: 'invoice.pdf',
        mime_type: 'application/pdf',
      })
    ).toBe('invoice.pdf');
  });

  it('repairs .bin using mime type', () => {
    expect(
      resolvePaperlessImportFilename({
        id: 2,
        title: 'Scan',
        original_file_name: 'scan.bin',
        mime_type: 'application/pdf',
      })
    ).toBe('scan.pdf');
  });

  it('adds extension from mime when only title is set', () => {
    expect(
      resolvePaperlessImportFilename({
        id: 3,
        title: 'Report',
        original_file_name: null,
        mime_type: 'application/pdf',
      })
    ).toBe('Report.pdf');
  });
});
