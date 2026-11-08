// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Page } from '@playwright/test';

/**
 * Drag a rectangle on the first PDF page, in fractions of its border box.
 *
 * A quarter-turn makes the page taller than the viewport. Fractions such as
 * 0.55 then sit below the window, and the pointer never hits the page. The
 * scroll parent is moved until the start is on screen. The end keeps the same
 * fractions, so the gesture is the one the caller asked for.
 */
export async function dragOnPdfPage(
  page: Page,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Promise<void> {
  const wrap = page.locator('.pdf-page-wrap').first();
  await wrap.waitFor({ state: 'visible' });
  await page.evaluate((start) => {
    const pageWrap = document.querySelector('.pdf-page-wrap');
    if (!(pageWrap instanceof HTMLElement)) return;
    const margin = 32;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const box = pageWrap.getBoundingClientRect();
      const x = box.left + box.width * start.x;
      const y = box.top + box.height * start.y;
      if (
        x >= margin &&
        y >= margin &&
        x <= window.innerWidth - margin &&
        y <= window.innerHeight - margin
      ) {
        return;
      }
      let moved = false;
      let node: HTMLElement | null = pageWrap.parentElement;
      while (node) {
        const style = getComputedStyle(node);
        const scrollsY = style.overflowY === 'auto' || style.overflowY === 'scroll';
        const scrollsX = style.overflowX === 'auto' || style.overflowX === 'scroll';
        if (scrollsY && y > node.getBoundingClientRect().bottom - margin) {
          node.scrollTop += y - (node.getBoundingClientRect().bottom - margin);
          moved = true;
        } else if (scrollsY && y < node.getBoundingClientRect().top + margin) {
          node.scrollTop -= node.getBoundingClientRect().top + margin - y;
          moved = true;
        }
        if (scrollsX && x > node.getBoundingClientRect().right - margin) {
          node.scrollLeft += x - (node.getBoundingClientRect().right - margin);
          moved = true;
        } else if (scrollsX && x < node.getBoundingClientRect().left + margin) {
          node.scrollLeft -= node.getBoundingClientRect().left + margin - x;
          moved = true;
        }
        node = node.parentElement;
      }
      if (y > window.innerHeight - margin) {
        window.scrollBy(0, y - (window.innerHeight - margin));
        moved = true;
      } else if (y < margin) {
        window.scrollBy(0, y - margin);
        moved = true;
      }
      if (!moved) return;
    }
  }, { x: x0, y: y0 });
  const box = await wrap.boundingBox();
  if (!box) throw new Error('pdf page wrap has no box');
  await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * x1, box.y + box.height * y1, { steps: 8 });
  await page.mouse.up();
}
