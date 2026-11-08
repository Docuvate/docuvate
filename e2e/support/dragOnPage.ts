// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Locator, Page } from '@playwright/test';

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
  await revealPagePoint(page, x0, y0);
  const box = await wrap.boundingBox();
  if (!box) throw new Error('pdf page wrap has no box');
  await page.mouse.move(box.x + box.width * x0, box.y + box.height * y0);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * x1, box.y + box.height * y1, { steps: 8 });
  await page.mouse.up();
}

/** Drag across a visible text span. The start stays below the sticky ribbon. */
export async function dragAcrossText(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  const first = await target.boundingBox();
  if (!first) throw new Error('text span has no box');
  await revealClientPoint(page, first.x + Math.min(8, first.width / 2), first.y + first.height / 2);
  const box = await target.boundingBox();
  if (!box) throw new Error('text span has no box');
  const startX = box.x + Math.min(4, box.width / 4);
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(box.x + Math.max(box.width - 4, startX + 12), startY + Math.min(28, box.height), {
    steps: 8,
  });
  await page.mouse.up();
}

async function revealPagePoint(page: Page, xRatio: number, yRatio: number): Promise<void> {
  await page.evaluate((start) => {
    const pageWrap = document.querySelector('.pdf-page-wrap');
    if (!(pageWrap instanceof HTMLElement)) return;
    const header = document.querySelector('.app-header');
    const topLimit = (header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 0) + 12;
    const margin = 24;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const box = pageWrap.getBoundingClientRect();
      const x = box.left + box.width * start.x;
      const y = box.top + box.height * start.y;
      if (x >= margin && y >= topLimit && x <= window.innerWidth - margin && y <= window.innerHeight - margin) {
        return;
      }
      const nearest = scrollableAncestor(pageWrap);
      const host = nearest ?? document.documentElement;
      let moved = false;
      if (y < topLimit) {
        host.scrollTop -= topLimit - y;
        moved = true;
      } else if (y > window.innerHeight - margin) {
        host.scrollTop += y - (window.innerHeight - margin);
        moved = true;
      }
      if (!moved) return;
    }

    function scrollableAncestor(node: HTMLElement): HTMLElement | null {
      let current: HTMLElement | null = node.parentElement;
      while (current) {
        const style = getComputedStyle(current);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') return current;
        current = current.parentElement;
      }
      return null;
    }
  }, { x: xRatio, y: yRatio });
}

async function revealClientPoint(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(({ x: clientX, y: clientY }) => {
    const header = document.querySelector('.app-header');
    const topLimit = (header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 0) + 12;
    if (clientY >= topLimit) return;
    const pageWrap = document.querySelector('.pdf-page-wrap');
    let current: HTMLElement | null = pageWrap instanceof HTMLElement ? pageWrap.parentElement : null;
    while (current) {
      const style = getComputedStyle(current);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        current.scrollTop -= topLimit - clientY;
        return;
      }
      current = current.parentElement;
    }
    window.scrollBy(0, clientY - topLimit);
  }, { x, y });
}
