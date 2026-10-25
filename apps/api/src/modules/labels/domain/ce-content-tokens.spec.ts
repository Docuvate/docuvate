// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { contentTokensFromText } from './ce-content-tokens.js';

describe('contentTokensFromText', () => {
  it('keeps alphabetic tokens with length at least three', () => {
    expect(contentTokensFromText('Rechnung Nr. 42 für Müller')).toEqual([
      'rechnung',
      'für',
      'müller',
    ]);
  });
});
