// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { documentDisplayDateParts } from './libraryDocumentUtils';

describe('documentDisplayDateParts', () => {
  it('formats ISO timestamps with locale instead of raw strings', () => {
    const parts = documentDisplayDateParts(
      {
        documentDate: null,
        createdAt: '2026-03-15T14:30:00.000Z',
        updatedAt: '2026-03-16T08:00:00.000Z',
      },
      'en-US'
    );
    expect(parts.text).not.toContain('T');
    expect(parts.text).not.toMatch(/2026-03-15T/);
  });

  it('formats German locale dates', () => {
    const parts = documentDisplayDateParts(
      {
        documentDate: '2026-03-15',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      'de-DE'
    );
    expect(parts.text).toMatch(/15/);
    expect(parts.text).not.toContain('2026-03-15T');
  });
});
