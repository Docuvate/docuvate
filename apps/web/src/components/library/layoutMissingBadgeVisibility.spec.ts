// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { showLayoutMissingBadge } from './layoutMissingBadgeVisibility';

describe('showLayoutMissingBadge', () => {
  it('hides while extraction is pending', () => {
    expect(
      showLayoutMissingBadge({ status: 'queued', layoutIrAvailable: false })
    ).toBe(false);
  });

  it('shows for ready docs without layout IR', () => {
    expect(
      showLayoutMissingBadge({ status: 'ready', layoutIrAvailable: false })
    ).toBe(true);
  });

  it('hides when layout IR is available', () => {
    expect(
      showLayoutMissingBadge({ status: 'ready', layoutIrAvailable: true })
    ).toBe(false);
  });

  it('falls back to extraction.layoutIrAvailable', () => {
    expect(
      showLayoutMissingBadge({
        status: 'ready',
        extraction: { text: 'x', fields: [], layoutIrAvailable: false },
      })
    ).toBe(true);
  });
});
