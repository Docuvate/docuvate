// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { diffExtractionFieldConfirmations } from './diff-extraction-field-confirmations.js';

describe('diffExtractionFieldConfirmations', () => {
  it('emits a draft when confidence crosses the confirmed threshold without value change', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.7 }],
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }]
      )
    ).toEqual([{ fieldKey: 'global:absender', fieldTagId: null }]);
  });

  it('ignores repeat confirms', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }],
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }]
      )
    ).toEqual([]);
  });

  it('does not treat value edits as confirmations', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'A', confidence: 0.5 }],
        [{ key: 'global:absender', value: 'B', confidence: 1 }]
      )
    ).toEqual([]);
  });
});
