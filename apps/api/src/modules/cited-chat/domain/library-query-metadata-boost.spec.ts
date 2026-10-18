// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildLibraryMetadataEmbedText,
  libraryMetadataEmbeddingBoost,
} from './library-query-metadata-boost.js';

describe('libraryMetadataEmbeddingBoost', () => {
  it('returns zero when vectors are missing', () => {
    expect(libraryMetadataEmbeddingBoost([0.1, 0.2], undefined)).toBe(0);
  });

  it('builds stable metadata embed text from title, filename, and date', () => {
    expect(
      buildLibraryMetadataEmbedText({
        title: 'Entgeltnachweis 10/2024',
        filename: 'payslip-2024-10.pdf',
        documentDate: '2024-10-01',
      })
    ).toContain('payslip-2024-10.pdf');
  });
});
