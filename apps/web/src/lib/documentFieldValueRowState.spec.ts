// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  fieldValueRowState,
  isUserConfirmedField,
  withSavedFieldValue,
} from './documentFieldValueRowState';

describe('fieldValueRowState', () => {
  it('treats a value without confidence as a suggestion, not as confirmed', () => {
    expect(isUserConfirmedField({})).toBe(false);
    expect(fieldValueRowState({ key: 'datum', value: '01.02.2026' }, undefined)).toBe('suggested');
  });

  it('keeps a high-confidence model value a suggestion until a person confirms it', () => {
    expect(fieldValueRowState({ key: 'vendor', value: 'x', confidence: 0.98 }, undefined)).toBe(
      'suggested'
    );
    expect(fieldValueRowState({ key: 'vendor', value: 'x', confidence: 1 }, undefined)).toBe(
      'suggested'
    );
  });

  it('marks user-confirmed values as confirmed regardless of confidence', () => {
    expect(
      fieldValueRowState(
        { key: 'datum', value: 'x', confidence: 0.4, userConfirmed: true },
        undefined
      )
    ).toBe('confirmed');
  });

  it('marks a changed value as corrected', () => {
    expect(fieldValueRowState({ key: 'datum', value: 'neu' }, { key: 'datum', value: 'alt' })).toBe(
      'corrected'
    );
  });
});

describe('withSavedFieldValue', () => {
  it('replaces an existing value and marks it user-confirmed', () => {
    const next = withSavedFieldValue([{ key: 'iban', value: '', confidence: 0.4 }], 'iban', 'DE00');
    expect(next).toEqual([{ key: 'iban', value: 'DE00', confidence: 1, userConfirmed: true }]);
  });

  it('appends a field that was not present', () => {
    const next = withSavedFieldValue([], 'iban', 'DE00');
    expect(next).toEqual([{ key: 'iban', value: 'DE00', confidence: 1, userConfirmed: true }]);
  });
});
