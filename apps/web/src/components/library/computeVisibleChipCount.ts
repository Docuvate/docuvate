// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const CHIP_GAP_PX = 4;
export const OVERFLOW_CHIP_RESERVE_PX = 44;
export const MIN_VISIBLE_CHIP_TEXT_CHARS = 6;

export interface ChipFitMetrics {
  labelLengths: readonly number[];
  sixCharWidthPx: number;
}

export function minReadableChipWidth(
  naturalWidth: number,
  labelLength: number,
  sixCharWidthPx: number
): number {
  if (labelLength <= MIN_VISIBLE_CHIP_TEXT_CHARS) {
    return naturalWidth;
  }
  const proportional = naturalWidth * (MIN_VISIBLE_CHIP_TEXT_CHARS / labelLength);
  return Math.max(sixCharWidthPx, proportional);
}

/**
 * Returns how many label chips to show before a +N overflow control.
 * When only one chip fits, a very wide first chip may count as truncated to the row limit.
 * Chips narrower than ~6 characters collapse to +N-only when overflow is shown.
 */
export function computeVisibleChipCount(
  naturalWidths: readonly number[],
  rowWidth: number,
  fit?: ChipFitMetrics
): number {
  if (naturalWidths.length === 0 || rowWidth <= 0) {
    return 0;
  }
  const lengths =
    fit?.labelLengths.length === naturalWidths.length
      ? fit.labelLengths
      : naturalWidths.map(() => MIN_VISIBLE_CHIP_TEXT_CHARS);
  const sixCharWidthPx = fit?.sixCharWidthPx ?? 0;

  const total = naturalWidths.length;
  for (let visible = total; visible >= 0; visible -= 1) {
    const overflow = total - visible;
    const limit = rowWidth - (overflow > 0 ? OVERFLOW_CHIP_RESERVE_PX : 0);
    if (overflow > 0 && limit <= 0) {
      continue;
    }
    if (visible === 0) {
      if (overflow > 0 && rowWidth >= OVERFLOW_CHIP_RESERVE_PX) {
        return 0;
      }
      continue;
    }

    let used = 0;
    let fits = true;
    for (let i = 0; i < visible; i += 1) {
      const gap = i > 0 ? CHIP_GAP_PX : 0;
      const natural = naturalWidths[i];
      const labelLength = lengths[i];
      let chipWidth = natural;
      if (visible === 1 && overflow > 0 && sixCharWidthPx > 0) {
        const minWidth = minReadableChipWidth(natural, labelLength, sixCharWidthPx);
        if (limit < minWidth) {
          fits = false;
          break;
        }
        chipWidth = Math.min(natural, limit);
      } else if (visible === 1 && overflow > 0) {
        chipWidth = Math.min(natural, limit);
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
  return 0;
}
