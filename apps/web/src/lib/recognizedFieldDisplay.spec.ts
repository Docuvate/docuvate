// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { splitRecognizedFieldsAndSuggestions } from './recognizedFieldDisplay';

describe('splitRecognizedFieldsAndSuggestions', () => {
  it('surfaces plain vendor as suggestion without catalog entry', () => {
    const { recognizedFields, heuristicSuggestions } = splitRecognizedFieldsAndSuggestions(
      [{ key: 'vendor', value: 'Acme GmbH' }],
      new Set()
    );
    expect(recognizedFields).toEqual([]);
    expect(heuristicSuggestions[0]?.key).toBe('vendor');
  });
});
