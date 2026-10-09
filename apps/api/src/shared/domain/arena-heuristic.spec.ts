// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { pickHeuristicArenaWinner } from './arena-heuristic.js';

describe('pickHeuristicArenaWinner', () => {
  it('picks the engine with the most text among successful runs', () => {
    const winner = pickHeuristicArenaWinner([
      { engine: 'a', elapsedMs: 1, text: 'short', charCount: 5 },
      { engine: 'b', elapsedMs: 2, text: 'much longer body', charCount: 16 },
    ]);
    expect(winner).toBe('b');
  });

  it('ignores errored engines', () => {
    const winner = pickHeuristicArenaWinner([
      { engine: 'a', elapsedMs: 1, error: 'boom' },
      { engine: 'b', elapsedMs: 2, text: 'ok', charCount: 2 },
    ]);
    expect(winner).toBe('b');
  });

  it('returns null when nothing succeeded', () => {
    expect(pickHeuristicArenaWinner([{ engine: 'a', elapsedMs: 1, error: 'x' }])).toBeNull();
  });
});
