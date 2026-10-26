// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { buildLabelPickerRows } from './buildLabelPickerRows';

function tag(name: string): TagDto {
  return {
    id: name,
    name,
    color: '#7c3aed',
    isInbox: false,
    matchingAlgorithm: 'none',
    match: '',
  };
}

describe('buildLabelPickerRows', () => {
  it('omits letter headers while searching', () => {
    const rows = buildLabelPickerRows([tag('ws-b-seed-0001'), tag('ws-b-seed-0002')], {
      showTruncatedHint: false,
      showEmpty: false,
      showLoading: false,
      groupByLetter: false,
    });
    expect(rows.every((row) => row.kind !== 'header')).toBe(true);
    expect(rows.filter((row) => row.kind === 'option')).toHaveLength(2);
  });

  it('groups by first letter when browsing without a query', () => {
    const rows = buildLabelPickerRows([tag('Alpha'), tag('Beta')], {
      showTruncatedHint: false,
      showEmpty: false,
      showLoading: false,
      groupByLetter: true,
    });
    const headers = rows.filter((row) => row.kind === 'header');
    expect(headers).toHaveLength(2);
  });
});
