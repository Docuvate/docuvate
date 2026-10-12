// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { pickAutoDocumentDateFromFields } from './documentAutoDocumentDate';

describe('pickAutoDocumentDateFromFields', () => {
  it('picks high-confidence date field as ISO document date', () => {
    const pick = pickAutoDocumentDateFromFields([
      { key: 'global:date', value: '12.03.2024', confidence: 0.91 },
    ]);
    expect(pick?.isoDate).toBe('2024-03-12');
  });
});
