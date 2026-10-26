// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  CHIP_GAP_PX,
  computeVisibleChipCount,
  OVERFLOW_CHIP_RESERVE_PX,
} from './computeVisibleChipCount';

describe('computeVisibleChipCount', () => {
  it('shows 2 chips and +2 when column fits two of four labels', () => {
    const rowWidth = 200;
    const chipWidth = 70;
    const naturalWidths = [chipWidth, chipWidth, chipWidth, chipWidth];
    const limit = rowWidth - OVERFLOW_CHIP_RESERVE_PX;
    expect(chipWidth + CHIP_GAP_PX + chipWidth).toBeLessThanOrEqual(limit);
    expect(chipWidth + CHIP_GAP_PX + chipWidth + CHIP_GAP_PX + chipWidth).toBeGreaterThan(limit);
    expect(computeVisibleChipCount(naturalWidths, rowWidth)).toBe(2);
  });

  it('shows 1 ellipsized chip and +3 when the first label is very long', () => {
    const rowWidth = 200;
    const naturalWidths = [320, 70, 70, 70];
    expect(computeVisibleChipCount(naturalWidths, rowWidth)).toBe(1);
  });
});
