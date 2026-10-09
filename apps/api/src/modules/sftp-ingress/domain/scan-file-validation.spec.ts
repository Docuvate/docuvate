// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { isTemporaryScanFilename, validateScanFile } from './scan-file-validation.js';

describe('scan-file-validation', () => {
  it('flags temporary suffixes', () => {
    expect(isTemporaryScanFilename('scan.part')).toBe(true);
    expect(isTemporaryScanFilename('scan.pdf')).toBe(false);
  });

  it('accepts pdf magic bytes', () => {
    const buffer = Buffer.from('%PDF-1.4\n');
    const result = validateScanFile('rechnung-mueller.pdf', buffer, 1024);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe('application/pdf');
    }
  });

  it('rejects unknown content', () => {
    const result = validateScanFile('note.txt', Buffer.from('hello'), 1024);
    expect(result.ok).toBe(false);
  });
});
