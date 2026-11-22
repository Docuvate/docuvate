// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { Locator, Page } from '@playwright/test';

/**
 * Drag a rectangle on the first PDF page, in fractions of its local MediaBox
 * (offsetWidth × offsetHeight), matching `clientPointToLocalRatio` in the web app.
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
  const start = await clientPointForLocalRatio(wrap, x0, y0);
  const end = await clientPointForLocalRatio(wrap, x1, y1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
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

async function clientPointForLocalRatio(
  wrap: Locator,
  xRatio: number,
  yRatio: number
): Promise<{ x: number; y: number }> {
  // evaluate serializes this callback into the page — keep helpers inline.
  return wrap.evaluate((pageWrap, ratios) => {
    function quarterTurns(rotationDeg: number): number {
      return ((Math.round(rotationDeg / 90) % 4) + 4) % 4;
    }
    function rotationDeg(el: HTMLElement): number {
      const raw = el.dataset.displayRotation;
      if (raw == null || raw === '') return 0;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const rotatedBounds = pageWrap.getBoundingClientRect();
    const localWidth = pageWrap.offsetWidth > 0 ? pageWrap.offsetWidth : 1;
    const localHeight = pageWrap.offsetHeight > 0 ? pageWrap.offsetHeight : 1;
    const turns = quarterTurns(rotationDeg(pageWrap));
    if (turns === 0) {
      const width = rotatedBounds.width > 0 ? rotatedBounds.width : 1;
      const height = rotatedBounds.height > 0 ? rotatedBounds.height : 1;
      return {
        x: rotatedBounds.left + ratios.x * width,
        y: rotatedBounds.top + ratios.y * height,
      };
    }
    const centerX = rotatedBounds.left + rotatedBounds.width / 2;
    const centerY = rotatedBounds.top + rotatedBounds.height / 2;
    const localDx = ratios.x * localWidth - localWidth / 2;
    const localDy = ratios.y * localHeight - localHeight / 2;
    const theta = (turns * Math.PI) / 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return {
      x: centerX + localDx * cos - localDy * sin,
      y: centerY + localDx * sin + localDy * cos,
    };
  }, { x: xRatio, y: yRatio });
}

async function revealPagePoint(page: Page, xRatio: number, yRatio: number): Promise<void> {
  await page.evaluate((start) => {
    const pageWrap = document.querySelector('.pdf-page-wrap');
    if (!(pageWrap instanceof HTMLElement)) return;
    const topLimit = stickyChromeBottom() + 12;
    const margin = 24;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const point = localRatioToClientPoint(pageWrap, start.x, start.y);
      if (
        point.x >= margin &&
        point.y >= topLimit &&
        point.x <= window.innerWidth - margin &&
        point.y <= window.innerHeight - margin
      ) {
        return;
      }
      const nearest = scrollableAncestor(pageWrap);
      const host = nearest ?? document.documentElement;
      let moved = false;
      if (point.y < topLimit) {
        host.scrollTop -= topLimit - point.y;
        moved = true;
      } else if (point.y > window.innerHeight - margin) {
        host.scrollTop += point.y - (window.innerHeight - margin);
        moved = true;
      }
      if (!moved) return;
    }

    function stickyChromeBottom(): number {
      let bottom = 0;
      for (const selector of ['.app-header', '.app-ribbon', '.layout-viewer-toolbar']) {
        const node = document.querySelector(selector);
        if (node instanceof HTMLElement) {
          bottom = Math.max(bottom, node.getBoundingClientRect().bottom);
        }
      }
      return bottom;
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

    function quarterTurnDegrees(rotationDeg: number): number {
      return ((Math.round(rotationDeg / 90) % 4) + 4) % 4;
    }

    function readDisplayRotationDeg(wrap: HTMLElement): number {
      const raw = wrap.dataset.displayRotation;
      if (raw == null || raw === '') return 0;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function localRatioToClientPoint(
      wrap: HTMLElement,
      lx: number,
      ly: number
    ): { x: number; y: number } {
      const rotatedBounds = wrap.getBoundingClientRect();
      const localWidth = wrap.offsetWidth > 0 ? wrap.offsetWidth : 1;
      const localHeight = wrap.offsetHeight > 0 ? wrap.offsetHeight : 1;
      const turns = quarterTurnDegrees(readDisplayRotationDeg(wrap));
      if (turns === 0) {
        const width = rotatedBounds.width > 0 ? rotatedBounds.width : 1;
        const height = rotatedBounds.height > 0 ? rotatedBounds.height : 1;
        return {
          x: rotatedBounds.left + lx * width,
          y: rotatedBounds.top + ly * height,
        };
      }
      const centerX = rotatedBounds.left + rotatedBounds.width / 2;
      const centerY = rotatedBounds.top + rotatedBounds.height / 2;
      const localDx = lx * localWidth - localWidth / 2;
      const localDy = ly * localHeight - localHeight / 2;
      const theta = (turns * Math.PI) / 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const dx = localDx * cos - localDy * sin;
      const dy = localDx * sin + localDy * cos;
      return { x: centerX + dx, y: centerY + dy };
    }
  }, { x: xRatio, y: yRatio });
}

async function revealClientPoint(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(({ x: clientX, y: clientY }) => {
    const topLimit =
      (() => {
        let bottom = 0;
        for (const selector of ['.app-header', '.app-ribbon', '.layout-viewer-toolbar']) {
          const node = document.querySelector(selector);
          if (node instanceof HTMLElement) {
            bottom = Math.max(bottom, node.getBoundingClientRect().bottom);
          }
        }
        return bottom;
      })() + 12;
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
