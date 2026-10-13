// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { resolveFollowUpQuery } from './resolve-follow-up-query.js';

describe('resolveFollowUpQuery', () => {
  it('returns current message when there is no prior turn', () => {
    expect(
      resolveFollowUpQuery('und wann ist sie fällig?', null, {
        current: [1, 0],
        prior: null,
      })
    ).toBe('und wann ist sie fällig?');
  });

});
