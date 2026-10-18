// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isPlainTextUploadMime } from './upload-document.use-case.js';

describe('isPlainTextUploadMime', () => {
  it('accepts text/plain', () => {
    expect(isPlainTextUploadMime('text/plain')).toBe(true);
    expect(isPlainTextUploadMime('text/plain; charset=utf-8')).toBe(true);
  });

  it('rejects other types', () => {
    expect(isPlainTextUploadMime('application/pdf')).toBe(false);
    expect(isPlainTextUploadMime('text/html')).toBe(false);
  });
});
