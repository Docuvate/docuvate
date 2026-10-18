// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { diffExtractionFieldCorrections } from './diff-extraction-field-corrections.js';

describe('diffExtractionFieldCorrections', () => {
  it('detects value changes only', () => {
    const drafts = diffExtractionFieldCorrections(
      [{ key: 'global:datum', value: '2024-01-01' }],
      [{ key: 'global:datum', value: '2024-02-01' }]
    );
    expect(drafts).toEqual([
      {
        fieldKey: 'global:datum',
        oldValue: '2024-01-01',
        newValue: '2024-02-01',
        fieldTagId: null,
      },
    ]);
  });

  it('ignores unchanged fields', () => {
    expect(
      diffExtractionFieldCorrections([{ key: 'a', value: 'x' }], [{ key: 'a', value: 'x' }])
    ).toEqual([]);
  });
});
