// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  buildDocumentListKeysetSql,
  buildDocumentListOrderBy,
  resolvedDocumentListSort,
} from './document-list-keyset.js';

describe('document list keyset', () => {
  it('builds updatedAt DESC order by', () => {
    expect(buildDocumentListOrderBy('updatedAt', 'desc')).toBe('d.updated_at DESC, d.id DESC');
  });

  it('builds documentDate ASC order by with nulls last', () => {
    expect(buildDocumentListOrderBy('documentDate', 'asc')).toBe(
      'd.document_date ASC NULLS LAST, d.id ASC'
    );
  });

  it('builds timestamp keyset for DESC', () => {
    const { conditionSql, params } = buildDocumentListKeysetSql(
      'updatedAt',
      'desc',
      {
        v: 1,
        sort: 'updatedAt',
        order: 'desc',
        id: '00000000-0000-4000-8000-000000000001',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      3
    );
    expect(conditionSql).toContain('d.updated_at');
    expect(conditionSql).toContain('<');
    expect(params).toHaveLength(2);
  });

  it('resolves default sort', () => {
    expect(resolvedDocumentListSort({})).toEqual({ sortField: 'updatedAt', order: 'desc' });
  });

  it('builds documentDate keyset when cursor date is null', () => {
    const { conditionSql, params } = buildDocumentListKeysetSql(
      'documentDate',
      'desc',
      {
        v: 1,
        sort: 'documentDate',
        order: 'desc',
        id: '00000000-0000-4000-8000-000000000099',
        documentDate: null,
      },
      2
    );
    expect(conditionSql).toContain('$2');
    expect(conditionSql).not.toContain('$3');
    expect(params).toEqual(['00000000-0000-4000-8000-000000000099']);
  });
});
