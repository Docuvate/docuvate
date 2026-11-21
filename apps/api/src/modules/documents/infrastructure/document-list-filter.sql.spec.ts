// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { buildDocumentListFilterSql } from './document-list-filter.sql.js';

describe('buildDocumentListFilterSql', () => {
  it('searches structured field values with amount digit-prefix params', () => {
    const { whereSql, params } = buildDocumentListFilterSql('user-1', { q: '1234' });
    expect(whereSql).toContain('document_field_values');
    expect(whereSql).toContain("regexp_replace(dfv.value_text, '[^0-9]', '', 'g')");
    expect(params).toEqual(['user-1', '1234', '1234', 1234]);
  });

  it('passes exact amount numeric when query is a German currency string', () => {
    const { params } = buildDocumentListFilterSql('user-1', { q: '1.234,56' });
    expect(params).toEqual(['user-1', '1.234,56', '123456', 1234.56]);
  });
});
