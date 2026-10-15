// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { CitedChatDocumentContextMeta } from './cited-chat-structured-context.js';
import { filterDocumentIdsByLibraryQueryPeriod } from './filter-document-ids-by-library-query-period.js';
import { libraryContextYearMonths } from './library-context-search-tokens.js';

describe('filterDocumentIdsByLibraryQueryPeriod', () => {
  const taxQuery =
    'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2024 insgesamt einbehalten?';

  it('parses no month period for Lohnsteuer 2024 question', () => {
    expect(libraryContextYearMonths(taxQuery)).toEqual([]);
  });

  it('keeps 2024 Lohnsteuer doc and drops 2023.pdf for year-scoped tax query', () => {
    const meta = new Map<string, CitedChatDocumentContextMeta>([
      [
        '2023-id',
        {
          documentId: '2023-id',
          filename: '2023.pdf',
          title: '2023.pdf',
          documentDate: null,
          labels: ['Lohnsteuerbescheinigung'],
          fields: [],
        },
      ],
      [
        '2024-id',
        {
          documentId: '2024-id',
          filename: '2024.pdf',
          title: '2024.pdf',
          documentDate: null,
          labels: ['Lohnsteuerbescheinigung'],
          fields: [],
        },
      ],
    ]);
    const filtered = filterDocumentIdsByLibraryQueryPeriod(
      ['2023-id', '2024-id'],
      taxQuery,
      meta
    );
    expect(filtered).toEqual(['2024-id']);
  });
});
