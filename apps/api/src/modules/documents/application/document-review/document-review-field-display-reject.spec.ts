// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSuggestionDecisionValue, suggestionDecisionFieldKey } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { filterRejectedReviewFieldSuggestions } from './document-review-field-display.js';

describe('suggestionDecisionFieldKey', () => {
  it('keeps the review-row key and does not alias a different field', () => {
    expect(suggestionDecisionFieldKey('vendor')).toBe('vendor');
    expect(suggestionDecisionFieldKey('suggestion:vendor')).toBe('vendor');
    expect(suggestionDecisionFieldKey('absender')).toBe('absender');
    expect(suggestionDecisionFieldKey('label:11111111-1111-4111-8111-111111111111:amount')).toBe(
      'label:11111111-1111-4111-8111-111111111111:amount'
    );
  });
});

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

  it('hides a review row when the stored decision used the earlier global: prefix', () => {
    const suggestions = [{ key: 'vendor', value: 'ACME GmbH' }];
    const rejects = [
      {
        fieldKey: 'global:vendor',
        valueNormalized: normalizeSuggestionDecisionValue('ACME GmbH'),
      },
    ];
    expect(filterRejectedReviewFieldSuggestions(suggestions, rejects)).toEqual([]);
  });

  it('keeps a different field that happens to share the normalized value', () => {
    const suggestions = [
      { key: 'vendor', value: 'ACME' },
      { key: 'absender', value: 'ACME' },
      { key: 'label:11111111-1111-4111-8111-111111111111:amount', value: 'ACME' },
    ];
    const rejects = [
      {
        fieldKey: 'vendor',
        valueNormalized: normalizeSuggestionDecisionValue('ACME'),
      },
    ];
    expect(filterRejectedReviewFieldSuggestions(suggestions, rejects)).toEqual([
      { key: 'absender', value: 'ACME' },
      { key: 'label:11111111-1111-4111-8111-111111111111:amount', value: 'ACME' },
    ]);
  });
});
