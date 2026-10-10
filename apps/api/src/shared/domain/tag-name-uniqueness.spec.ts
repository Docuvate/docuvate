// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { assertTagNameNotNearDuplicate, findNearDuplicateTag } from './tag-name-uniqueness.js';

describe('tag-name-uniqueness', () => {
  const tags = [
    { id: '1', name: 'Vertrag' },
    { id: '2', name: 'Rechnung' },
  ];

  it('finds case-insensitive duplicates', () => {
    expect(findNearDuplicateTag('vertrag', tags)?.name).toBe('Vertrag');
  });

  it('finds near-duplicate spellings', () => {
    expect(findNearDuplicateTag('Rechnungen', tags)?.name).toBe('Rechnung');
  });

  it('allows editing the same tag', () => {
    expect(findNearDuplicateTag('Vertrag', tags, '1')).toBeNull();
  });

  it('throws on create conflict', () => {
    expect(() => { assertTagNameNotNearDuplicate('vertrag', tags); }).toThrow(/existiert bereits/);
  });
});
