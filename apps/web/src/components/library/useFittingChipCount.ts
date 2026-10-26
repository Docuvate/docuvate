// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type RefObject, useLayoutEffect, useState } from 'react';

import {
  computeVisibleChipCount,
  MIN_VISIBLE_CHIP_TEXT_CHARS,
} from './computeVisibleChipCount';

export function useFittingChipCount(
  rowRef: RefObject<HTMLDivElement | null>,
  measureRef: RefObject<HTMLDivElement | null>,
  chipCount: number
): number {
  const [visibleCount, setVisibleCount] = useState(chipCount);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) {
      return;
    }

    const recompute = () => {
      if (chipCount === 0) {
        setVisibleCount(0);
        return;
      }

      const rowWidth = row.getBoundingClientRect().width;
      if (rowWidth <= 0) {
        return;
      }
      const sixCharProbe = measure.querySelector('[data-measure-six-chars]');
      const sixCharWidthPx =
        sixCharProbe instanceof HTMLElement ? sixCharProbe.getBoundingClientRect().width : 0;

      const chips = measure.querySelectorAll('[data-measure-chip]');
      const naturalWidths: number[] = [];
      const labelLengths: number[] = [];
      for (let i = 0; i < chips.length; i += 1) {
        const chip = chips.item(i);
        if (chip instanceof HTMLElement) {
          naturalWidths.push(chip.getBoundingClientRect().width);
          const lengthAttr = chip.getAttribute('data-label-length');
          const parsed = lengthAttr ? Number.parseInt(lengthAttr, 10) : Number.NaN;
          labelLengths.push(Number.isFinite(parsed) ? parsed : MIN_VISIBLE_CHIP_TEXT_CHARS);
        }
      }
      if (naturalWidths.length === 0) {
        setVisibleCount(chipCount);
        return;
      }

      setVisibleCount(
        computeVisibleChipCount(naturalWidths, rowWidth, {
          labelLengths,
          sixCharWidthPx,
        })
      );
    };

    recompute();
    const observer = new ResizeObserver(() => {
      recompute();
    });
    observer.observe(row);
    return () => {
      observer.disconnect();
    };
  }, [chipCount, measureRef, rowRef]);

  return visibleCount;
}
