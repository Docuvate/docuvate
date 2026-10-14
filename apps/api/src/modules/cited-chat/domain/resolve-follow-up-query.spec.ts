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

  it('merges short coreference follow-ups when embeddings align', () => {
    vi.spyOn(intentSchema, 'classifyChatRouteIntent').mockReturnValue('document_qa');

    const merged = resolveFollowUpQuery('und wann ist sie fällig?', 'Wie hoch ist die Rechnung?', {
      current: [0.99, 0.01],
      prior: [0.98, 0.02],
    });

    expect(merged).toBe('Wie hoch ist die Rechnung? und wann ist sie fällig?');
  });

  it('does not merge a new standalone library question after a prior document Q&A turn', () => {
    vi.spyOn(intentSchema, 'classifyChatRouteIntent').mockReturnValue('document_qa');
    const lohnsteuer =
      'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2024 insgesamt einbehalten?';

    const resolved = resolveFollowUpQuery(
      lohnsteuer,
      'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?',
      {
        current: [0.2, 0.8],
        prior: [0.8, 0.2],
      }
    );

    expect(resolved).toBe(lohnsteuer);
  });
});
