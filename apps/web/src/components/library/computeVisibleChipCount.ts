// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const CHIP_GAP_PX = 4;
export const OVERFLOW_CHIP_RESERVE_PX = 44;

/**
 * Returns how many label chips to show before a +N overflow control.
 * When only one chip fits, a very wide first chip may count as truncated to the row limit.
 */
export function computeVisibleChipCount(
  naturalWidths: readonly number[],
  rowWidth: number
): number {
  if (naturalWidths.length === 0 || rowWidth <= 0) {
    return 0;
  }
  const total = naturalWidths.length;
  for (let visible = total; visible >= 1; visible -= 1) {
    const overflow = total - visible;
    const limit = rowWidth - (overflow > 0 ? OVERFLOW_CHIP_RESERVE_PX : 0);
    if (limit <= 0) {
      continue;
    }
    let used = 0;
    let fits = true;
    for (let i = 0; i < visible; i += 1) {
      const gap = i > 0 ? CHIP_GAP_PX : 0;
      let chipWidth = naturalWidths[i];
      if (visible === 1 && overflow > 0 && chipWidth > limit) {
        chipWidth = limit;
      }
      if (used + gap + chipWidth > limit + 0.5) {
        fits = false;
        break;
      }
      used += gap + chipWidth;
    }
    if (fits) {
      return visible;
    }
  }
  if (total > 0 && rowWidth > OVERFLOW_CHIP_RESERVE_PX) {
    return 1;
  }
  return 0;
}
