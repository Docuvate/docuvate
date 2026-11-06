// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSuggestionDecisionValue } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { filterRejectedReviewFieldSuggestions } from './document-review-field-display.js';

describe('filterRejectedReviewFieldSuggestions', () => {
  it('drops only the rejected field+normalized value', () => {
    const suggestions = [
      { key: 'global:sender', value: 'BDEW-Strompreisanalyse' },
      { key: 'global:sender', value: 'Other Corp' },
      { key: 'global:amount', value: '83.99' },
    ];
    const rejects = [
      {
        fieldKey: 'global:sender',
        valueNormalized: normalizeSuggestionDecisionValue('BDEW-Strompreisanalyse'),
      },
    ];
    expect(filterRejectedReviewFieldSuggestions(suggestions, rejects)).toEqual([
      { key: 'global:sender', value: 'Other Corp' },
      { key: 'global:amount', value: '83.99' },
    ]);
  });

  it('treats whitespace and case as the same value', () => {
    const suggestions = [{ key: 'global:amount', value: '  83.99 ' }];
    const rejects = [
      {
        fieldKey: 'global:amount',
        valueNormalized: normalizeSuggestionDecisionValue('83.99'),
      },
    ];
    expect(filterRejectedReviewFieldSuggestions(suggestions, rejects)).toEqual([]);
  });
});
