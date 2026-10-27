// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { canonicalRegionPayload } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

describe('field correction canonical hash', () => {
  it('treats identical token sets and geometry as a no-op', () => {
    const before = canonicalRegionPayload({
      role: 'field',
      page: 1,
      rect: { x0: 0.2, y0: 0.3, x1: 0.32, y1: 0.34 },
      blockIndexes: [4, 5],
      fieldKey: 'global:nachzahlung',
      valueOverride: '208,82 €',
    });
    const after = canonicalRegionPayload({
      role: 'field',
      page: 1,
      rect: { x0: 0.20004, y0: 0.3, x1: 0.32, y1: 0.34 },
      blockIndexes: [5, 4],
      fieldKey: 'global:nachzahlung',
      valueOverride: '208,82 €',
    });
    expect(before).toBe(after);
  });

  it('changes when the token set changes', () => {
    const before = canonicalRegionPayload({
      role: 'field',
      page: 1,
      rect: { x0: 0.2, y0: 0.3, x1: 0.32, y1: 0.34 },
      blockIndexes: [4],
      fieldKey: 'global:nachzahlung',
      valueOverride: '208,82 €',
    });
    const after = canonicalRegionPayload({
      role: 'field',
      page: 1,
      rect: { x0: 0.2, y0: 0.3, x1: 0.32, y1: 0.34 },
      blockIndexes: [4, 5],
      fieldKey: 'global:nachzahlung',
      valueOverride: '208,82 €',
    });
    expect(before).not.toBe(after);
  });
});
