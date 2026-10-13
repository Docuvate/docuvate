// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as intentSchema from './chat-intent-prototypes.schema.js';
import { resolveFollowUpQuery } from './resolve-follow-up-query.js';

describe('resolveFollowUpQuery', () => {
  beforeEach(() => {
    vi.spyOn(intentSchema, 'classifyChatRouteIntent').mockReset();
  });

  it('returns current message when there is no prior turn', () => {
    expect(
      resolveFollowUpQuery('und wann ist sie fällig?', null, {
        current: [1, 0],
        prior: null,
      })
    ).toBe('und wann ist sie fällig?');
  });

  it('merges short document follow-ups when the prior turn is document Q&A', () => {
    vi.spyOn(intentSchema, 'classifyChatRouteIntent')
      .mockReturnValueOnce('document_qa')
      .mockReturnValueOnce('document_qa');

    const merged = resolveFollowUpQuery('und wann ist sie fällig?', 'Wie hoch ist die Rechnung?', {
      current: [0.01, 0.99],
      prior: [0.99, 0.01],
    });

    expect(merged).toBe('Wie hoch ist die Rechnung? und wann ist sie fällig?');
  });
});
