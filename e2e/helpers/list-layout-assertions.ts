// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page } from '@playwright/test';

function rectsIntersect(
  a: { top: number; left: number; right: number; bottom: number },
  b: { top: number; left: number; right: number; bottom: number }
): boolean {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
}

/**
 * Asserts each row's direct children do not overlap and stay within the scroll container width.
 */
export async function assertScrollListRowsLayout(
  page: Page,
  scrollSelector: string,
  rowSelector: string
): Promise<void> {
  const issues = await page.evaluate(
    ({ scrollSel, rowSel }) => {
      const scroll = document.querySelector(scrollSel);
      if (!scroll) {
        return ['missing scroll container'];
      }
      const scrollRect = scroll.getBoundingClientRect();
      const rows = scroll.querySelectorAll(rowSel);
      const out: string[] = [];
      rows.forEach((row, rowIndex) => {
        const rowRect = row.getBoundingClientRect();
        if (rowRect.right > scrollRect.right + 1) {
          out.push(`row ${String(rowIndex)} exceeds scroll right`);
        }
        const children = row.querySelectorAll(':scope > *');
        const rects: DOMRect[] = [];
        children.forEach((child) => {
          const rect = child.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            rects.push(rect);
          }
        });
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const a = rects[i];
            const b = rects[j];
            const intersect = !(
              a.right <= b.left ||
              b.right <= a.left ||
              a.bottom <= b.top ||
              b.bottom <= a.top
            );
            if (intersect) {
              out.push(`row ${String(rowIndex)} children ${String(i)} and ${String(j)} overlap`);
            }
          }
        }
      });
      return out;
    },
    { scrollSel: scrollSelector, rowSel: rowSelector }
  );

  expect(issues, `layout violations in ${scrollSelector}`).toEqual([]);
}

export function assertRectsDisjoint(
  a: { top: number; left: number; right: number; bottom: number },
  b: { top: number; left: number; right: number; bottom: number }
): void {
  expect(rectsIntersect(a, b)).toBe(false);
}
