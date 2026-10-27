// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

const CONTAINERS = ['.document-detail-page', '.layout-side-panel', '.label-panel', '.label-chip-row'];
const DEFAULT_CURSOR_SCREENSHOTS = '/opt/cursor/artifacts/screenshots';

interface OverflowHit {
  container: string;
  child: string;
  childRight: number;
  parentRight: number;
}

interface ChipBoxIssue {
  kind: 'overlap' | 'clip';
  first: string;
  second: string;
}

interface ChipTooltipState {
  title: string;
  overflow: string;
  truncated: boolean;
}

interface BottomSheetLayout {
  ok: boolean;
  reason: string;
}

function artifactOutputDirs(): string[] {
  const dirs: string[] = [];
  const fieldDir = process.env['FIELD_REGIONS_ARTIFACT_DIR'];
  const tableDir = process.env['TABLE_REGIONS_ARTIFACT_DIR'];
  if (fieldDir) {
    dirs.push(fieldDir);
  }
  if (tableDir && tableDir !== fieldDir) {
    dirs.push(tableDir);
  }
  return dirs;
}

function cursorScreenshotDir(): string | undefined {
  const fromEnv = process.env['CURSOR_ARTIFACT_SCREENSHOTS_DIR'];
  if (fromEnv) {
    return fromEnv;
  }
  if (existsSync('/opt/cursor/artifacts')) {
    return DEFAULT_CURSOR_SCREENSHOTS;
  }
  return undefined;
}

function writeScreenshotFiles(name: string, body: Buffer): void {
  for (const dir of artifactOutputDirs()) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  const cursorDir = cursorScreenshotDir();
  if (!cursorDir) {
    return;
  }
  mkdirSync(cursorDir, { recursive: true });
  const hash = createHash('md5').update(body).digest('hex').slice(0, 8);
  const hashed = name.endsWith('.png') ? `${name.slice(0, -4)}-${hash}.png` : `${name}-${hash}`;
  writeFileSync(join(cursorDir, hashed), body);
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const hits = await page.evaluate((selectors) => {
    const skipClosest = [
      '[data-floating-placement]',
      '.toast-region',
      '.overlay-portal',
      '.pdf-page-wrap',
    ];
    const results: OverflowHit[] = [];
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((container) => {
        if (!(container instanceof HTMLElement)) {
          return;
        }
        const descendants = container.querySelectorAll('*');
        descendants.forEach((child) => {
          if (!(child instanceof HTMLElement)) {
            return;
          }
          const parent = child.parentElement;
          if (!(parent instanceof HTMLElement)) {
            return;
          }
          const style = window.getComputedStyle(child);
          const parentStyle = window.getComputedStyle(parent);
          if (
            style.position === 'fixed' ||
            style.position === 'absolute' ||
            style.position === 'sticky'
          ) {
            return;
          }
          if (style.visibility === 'hidden' || style.display === 'none') {
            return;
          }
          if (
            parentStyle.overflowX === 'auto' ||
            parentStyle.overflowX === 'scroll' ||
            parentStyle.overflow === 'auto' ||
            parentStyle.overflow === 'scroll'
          ) {
            return;
          }
          if (skipClosest.some((skip) => child.closest(skip) !== null && !child.matches(skip))) {
            return;
          }
          const parentBox = parent.getBoundingClientRect();
          if (parentBox.width <= 0) {
            return;
          }
          const box = child.getBoundingClientRect();
          if (box.width <= 0 || box.height <= 0) {
            return;
          }
          if (box.right > parentBox.right + 1.5) {
            results.push({
              container: selector,
              child: `${child.tagName.toLowerCase()}.${child.className.toString()}`,
              childRight: box.right,
              parentRight: parentBox.right,
            });
          }
        });
      });
    }
    return results;
  }, CONTAINERS);
  expect(hits, JSON.stringify(hits)).toEqual([]);
}

export async function assertNoClippedOrOverlappingChips(page: Page): Promise<void> {
  const issues = await page.evaluate(() => {
    const out: ChipBoxIssue[] = [];
    const row =
      document.querySelector('.label-chip-row-visible') ??
      document.querySelector('.overflow-chip-list');
    if (!(row instanceof HTMLElement)) {
      return out;
    }
    const rowBox = row.getBoundingClientRect();
    const boxes = Array.from(row.children)
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .filter((el) => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return (
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          box.width > 0 &&
          box.height > 0
        );
      })
      .map((el) => ({
        name: `${el.tagName.toLowerCase()}.${el.className.toString()}`,
        box: el.getBoundingClientRect(),
      }));
    for (const item of boxes) {
      if (item.box.right > rowBox.right + 1.5 || item.box.left < rowBox.left - 1.5) {
        out.push({ kind: 'clip', first: item.name, second: 'overflow-chip-list' });
      }
    }
    for (let i = 0; i < boxes.length; i += 1) {
      const a = boxes[i];
      if (!a) {
        continue;
      }
      for (let j = i + 1; j < boxes.length; j += 1) {
        const b = boxes[j];
        if (!b) {
          continue;
        }
        const overlap = !(
          a.box.right <= b.box.left + 0.5 ||
          b.box.right <= a.box.left + 0.5 ||
          a.box.bottom <= b.box.top + 0.5 ||
          b.box.bottom <= a.box.top + 0.5
        );
        if (overlap) {
          out.push({ kind: 'overlap', first: a.name, second: b.name });
        }
      }
    }
    return out;
  });
  expect(issues, JSON.stringify(issues)).toEqual([]);
}

export async function assertLongLabelChipsTruncateWithTooltip(page: Page): Promise<void> {
  const chips = await page.evaluate(() => {
    const nodes = document.querySelectorAll(
      '.label-chip-row-visible .chip-label-truncate, .overflow-chip-list > .chip-label-truncate'
    );
    const result: ChipTooltipState[] = [];
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const label = node.querySelector('.chip-label');
      if (!(label instanceof HTMLElement)) {
        return;
      }
      result.push({
        title: node.getAttribute('title') ?? '',
        overflow: getComputedStyle(label).textOverflow,
        truncated: label.scrollWidth > label.clientWidth + 1,
      });
    });
    return result;
  });
  expect(chips.length).toBeGreaterThan(0);
  expect(chips.every((chip) => chip.title.length > 8)).toBe(true);
  expect(chips.every((chip) => chip.overflow === 'ellipsis')).toBe(true);
  expect(chips.some((chip) => chip.truncated)).toBe(true);
}

export async function assertCorrectionsBottomSheet(page: Page): Promise<void> {
  const sheet = page.locator('[data-testid="field-correction-sheet"]');
  await expect(sheet).toBeVisible({ timeout: 15_000 });
  await expect(sheet).toHaveAttribute('role', 'dialog');
  await expect(sheet).toHaveAttribute('aria-modal', 'true');
  const layout = await page.evaluate((): BottomSheetLayout => {
    const pageRoot = document.querySelector('.document-detail-page');
    const workspace = pageRoot?.querySelector('.layout-workspace');
    const stage = pageRoot?.querySelector('.layout-viewer-stage, .layout-viewer-card, .pdf-page-canvas');
    const sheetEl =
      document.querySelector('[data-testid="field-correction-sheet"]') ??
      document.querySelector('.bottom-sheet-panel[role="dialog"]');
    if (!(workspace instanceof HTMLElement) || !(sheetEl instanceof HTMLElement)) {
      return { ok: false, reason: 'missing workspace or correction sheet' };
    }
    const columns = getComputedStyle(workspace).gridTemplateColumns.trim();
    const columnCount = columns.split(/\s+/).filter((part) => part.length > 0).length;
    const sheetBox = sheetEl.getBoundingClientRect();
    const stageBox = stage instanceof HTMLElement ? stage.getBoundingClientRect() : null;
    const documentVisible = stageBox ? stageBox.height > 80 : true;
    const sheetBelow = stageBox ? sheetBox.top + 1 >= stageBox.top + 40 : true;
    return {
      ok: columnCount === 1 && documentVisible && sheetBelow && sheetBox.height > 0,
      reason: `cols=${columns} sheetTop=${String(sheetBox.top)} stageTop=${String(stageBox?.top ?? 'n/a')} stageH=${String(stageBox?.height ?? 'n/a')}`,
    };
  });
  expect(layout.ok, layout.reason).toBe(true);
}

export async function assertOverflowMissesHeader(page: Page): Promise<void> {
  const overlap = await page.evaluate(() => {
    const header =
      document.querySelector('.app-topbar') ?? document.querySelector('[data-testid="app-topbar"]');
    const popover =
      document.querySelector('.label-chip-row-overflow-popover') ??
      document.querySelector('[data-testid="label-overflow-sheet"]');
    if (!(header instanceof HTMLElement) || !(popover instanceof HTMLElement)) {
      return { ok: false, reason: 'missing header or overflow' };
    }
    const a = header.getBoundingClientRect();
    const b = popover.getBoundingClientRect();
    const intersects = !(
      a.bottom <= b.top + 0.5 ||
      b.bottom <= a.top + 0.5 ||
      a.right <= b.left + 0.5 ||
      b.right <= a.left + 0.5
    );
    return { ok: !intersects, reason: `headerBottom=${String(a.bottom)} popoverTop=${String(b.top)}` };
  });
  expect(overlap.ok, overlap.reason).toBe(true);
}

export async function assertFieldRegionRenderedWithValue(page: Page): Promise<void> {
  const overlay = page.locator('[data-overlay-id^="region-field-"]').first();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(overlay).toHaveClass(/pdf-layout-overlay-field/);
  const value = page.locator('.field-value-row-value, .document-field-correction-value-text, .document-field-correction-value input').first();
  await expect(value).toBeVisible({ timeout: 15_000 });
  const text = ((await value.inputValue().catch(async () => value.innerText())) ?? '').trim();
  expect(text.length).toBeGreaterThan(0);
  expect(text).not.toBe('-');
}

export async function captureLoadedScreenshot(
  locator: Locator,
  testInfo: Pick<TestInfo, 'attach'>,
  name: string
): Promise<Buffer> {
  await locator.waitFor({ state: 'visible', timeout: 60_000 });
  const body = await locator.screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  writeScreenshotFiles(name, body);
  return body;
}

export async function captureViewportScreenshot(
  page: Page,
  testInfo: Pick<TestInfo, 'attach'>,
  name: string
): Promise<Buffer> {
  const body = await page.screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  writeScreenshotFiles(name, body);
  return body;
}
