// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { fieldValueRowState, isConfirmedFieldConfidence } from './documentFieldValueRowState';

describe('fieldValueRowState', () => {
  it('treats a value without confidence as a suggestion, not as confirmed', () => {
    expect(isConfirmedFieldConfidence(undefined)).toBe(false);
    expect(fieldValueRowState({ key: 'datum', value: '01.02.2026' }, undefined)).toBe('suggested');
  });

  it('marks confident or user-confirmed values as confirmed', () => {
    expect(fieldValueRowState({ key: 'datum', value: 'x', confidence: 1 }, undefined)).toBe(
      'confirmed'
    );
    expect(fieldValueRowState({ key: 'datum', value: 'x', confidence: 0.5 }, undefined)).toBe(
      'suggested'
    );
  });

  it('marks a changed value as corrected', () => {
    expect(
      fieldValueRowState({ key: 'datum', value: 'neu' }, { key: 'datum', value: 'alt' })
    ).toBe('corrected');
  });
});
