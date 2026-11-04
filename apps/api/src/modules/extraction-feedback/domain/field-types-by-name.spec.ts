// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { canonicalFieldName } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { fieldTypesByName } from './field-types-by-name.js';

describe('canonicalFieldName', () => {
  it('maps storage-key spellings of one field to the same name', () => {
    const names = new Set(
      [
        'global:absender',
        'suggestion:absender',
        'Absender',
        'label:0b6b1d1e-8a4f-4c3e-9d2a-5b7c8e9f0a1b:absender',
      ].map(canonicalFieldName)
    );
    expect(names.size).toBe(1);
  });
});

describe('fieldTypesByName', () => {
  it('keeps agreeing types and nulls conflicting ones', () => {
    const types = fieldTypesByName([
      { key: 'global:betrag', fieldType: 'currency' },
      { key: 'betrag', fieldType: 'currency' },
      { key: 'global:datum', fieldType: 'date' },
      { key: 'datum', fieldType: 'text' },
    ]);
    expect(types.get(canonicalFieldName('betrag'))).toBe('currency');
    expect(types.get(canonicalFieldName('datum'))).toBeNull();
  });
});
