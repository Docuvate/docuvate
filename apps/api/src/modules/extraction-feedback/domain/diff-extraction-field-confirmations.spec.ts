// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { diffExtractionFieldConfirmations } from './diff-extraction-field-confirmations.js';

describe('diffExtractionFieldConfirmations', () => {
  it('emits a draft when a person confirms a value without changing it', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.98 }],
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1, userConfirmed: true }]
      )
    ).toEqual([{ fieldKey: 'global:absender', value: 'Nordwind GmbH', fieldTagId: null }]);
  });

  it('does not treat high model confidence as a confirmation', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.7 }],
        [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }]
      )
    ).toEqual([]);
  });

  it('ignores repeat confirms', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'Nordwind GmbH', userConfirmed: true }],
        [{ key: 'global:absender', value: 'Nordwind GmbH', userConfirmed: true }]
      )
    ).toEqual([]);
  });

  it('does not treat value edits as confirmations', () => {
    expect(
      diffExtractionFieldConfirmations(
        [{ key: 'global:absender', value: 'A', confidence: 0.5 }],
        [{ key: 'global:absender', value: 'B', confidence: 1, userConfirmed: true }]
      )
    ).toEqual([]);
  });
});
