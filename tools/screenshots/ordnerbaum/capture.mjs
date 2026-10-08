#!/usr/bin/env node
/**
 * Ordner/Bibliothek toolbar + tree screenshot capture (populated state only).
 */
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CONTROL_HEIGHT_PX = 40;
const ICON_BUTTON_MD_PX = 40;
const FILESYSTEM_ICON_BUTTON_MD_PX = 40;
const ICON_BUTTON_HEAD_PX = 40;
const GEOMETRY_TOLERANCE_PX = 1;
const SEARCH_GAP_MIN_PX = 8;
const MIN_DOC_ROWS = 6;
const MIN_DIREKT_COUNT = 6;
const HEADER_TITLE_ACTIONS_MAX_GAP_PX = 12;
const HEADER_MAX_HEIGHT_390_PX = 168;

const OUT = process.env.SCREENSHOT_DIR ?? 'artifacts/screenshots/ordnerbaum';
const BASE = process.env.WEB_BASE ?? 'http://localhost:5173';

function refreshSeed() {
  const webOrigin = new URL(BASE).origin;
  const authOrigin = process.env.E2E_AUTH_ORIGIN ?? webOrigin;
  const seedOut = execSync('node tools/screenshots/ordnerbaum/seed.mjs', {
    cwd: ROOT,
    timeout: 300_000,
    env: {
      ...process.env,
      WEB_ORIGIN: authOrigin,
      AUTH_BASE: process.env.AUTH_BASE ?? `${new URL(authOrigin).origin}/api/auth`,
      API_BASE: process.env.API_BASE ?? `${new URL(authOrigin).origin.replace(/:\d+$/, ':3001')}/v1`,
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@localhost:5433/docuvate',
    },
  }).toString();
  return JSON.parse(seedOut);
}

async function addSession(context, authCookie, host) {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: decodeURIComponent(authCookie),
      domain: host,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

async function prepareOrdner(page, direktFolderId, { wideSidebar = false } = {}) {
  if (wideSidebar) {
    await page.addInitScript(() => {
      window.localStorage.setItem('docuvate.dateisystem.sidebarWidth', '400');
    });
  }
  await page.goto(`${BASE}/filesystem/folders/${direktFolderId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
  await page.locator('a.sidebar-mappe-link.dateisystem-tree-link', { hasText: 'EHW+' }).click();
  await page.waitForURL(/\/filesystem\/containers\//, { timeout: 20_000 });
  const direktLink = page.locator('a.dateisystem-tree-link', { hasText: /^Direkt$/ });
  if ((await direktLink.count()) === 0) {
    const mappeRow = page.locator('.dateisystem-tree-row').filter({
      has: page.locator('a.sidebar-mappe-link', { hasText: 'EHW+' }),
    });
    await mappeRow.locator('button.dateisystem-tree-chevron').click();
  }
  await direktLink.click();
  await page.waitForURL(new RegExp(`/filesystem/folders/${direktFolderId}`), { timeout: 15_000 });
  await waitForPopulatedFolder(page, direktFolderId);
}

async function waitForPopulatedFolder(page, direktFolderId) {
  await page.waitForFunction(
    ({ minRows, minCount, folderId }) => {
      const panel = document.querySelector('.library-doc-table-card .library-documents-panel');
      if (panel?.getAttribute('aria-busy') === 'true') return false;
      const spinner = document.querySelector('.library-doc-table-card .library-table-loading-spinner');
      if (spinner?.checkVisibility?.() ?? spinner) return false;
      const failed = document.querySelectorAll('.library-doc-table-card .badge-failed');
      if (failed.length > 0) return false;
      const rows = document.querySelectorAll(
        '.library-doc-table-card tbody tr, .library-doc-table-card .library-document-grid-card, .library-doc-table-card .library-doc-stack-item'
      );
      const labeled = document.querySelectorAll('.library-doc-table-card .document-labels-cell .chip');
      if (labeled.length < 3) return false;
      const direktRow = [...document.querySelectorAll('.dateisystem-tree-row')].find((row) => {
        const link = row.querySelector('a.dateisystem-tree-link');
        return link?.textContent?.trim() === 'Direkt';
      });
      const countEl = direktRow?.querySelector('.dateisystem-tree-count');
      const count = countEl ? Number.parseInt(countEl.textContent?.trim() ?? '0', 10) : 0;
      const onFolder = window.location.pathname.includes(folderId);
      return onFolder && rows.length >= minRows && count >= minCount;
    },
    { minRows: MIN_DOC_ROWS, minCount: MIN_DIREKT_COUNT, folderId: direktFolderId },
    { timeout: 120_000 }
  );
}

async function computeDocRowsClip(page) {
  return page.evaluate(() => {
    const main = document.querySelector('.app-main');
    if (!main) return null;
    const card = document.querySelector('.library-doc-table-card');
    const list = document.querySelector('.library-doc-stack-list');
    const selectAll = document.querySelector('.library-doc-stack-select-all');
    const items = [...document.querySelectorAll('.library-doc-stack-item')];
    if (!card || !list || items.length === 0) return null;

    const measure = () => {
      const mainRect = main.getBoundingClientRect();
      const mainTop = mainRect.top;
      const mainBottom = mainRect.bottom;
      const cardR = card.getBoundingClientRect();
      const visibleItems = items.filter((item) => {
        const r = item.getBoundingClientRect();
        return r.bottom > mainTop + 1 && r.top < mainBottom - 1;
      });
      let top;
      let bottom;
      if (visibleItems.length > 0) {
        const first = visibleItems[0].getBoundingClientRect();
        const last = visibleItems[visibleItems.length - 1].getBoundingClientRect();
        top = selectAll ? Math.min(selectAll.getBoundingClientRect().top, first.top) : first.top;
        bottom = last.bottom;
      } else {
        const anchor = selectAll ?? items[0];
        top = anchor.getBoundingClientRect().top;
        bottom = items[Math.min(5, items.length - 1)].getBoundingClientRect().bottom;
      }
      top = Math.max(top, mainTop);
      bottom = Math.min(bottom, mainBottom);
      return { top, bottom, cardR, height: bottom - top };
    };

    let box = measure();
    if (box.height < 40) {
      const anchor = selectAll ?? items[0];
      const anchorRect = anchor.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      main.scrollTop += anchorRect.top - mainRect.top - 24;
      box = measure();
    }
    if (box.height < 40) return null;
    return {
      x: Math.max(0, Math.floor(box.cardR.left)),
      y: Math.max(0, Math.floor(box.top)),
      width: Math.ceil(Math.min(box.cardR.width, document.documentElement.clientWidth - box.cardR.left)),
      height: Math.ceil(box.height),
    };
  });
}

async function shot(page, name, { clip, docRows = false } = {}) {
  const file = path.join(OUT, name);
  if (docRows) {
    const rowsClip = clip ?? (await computeDocRowsClip(page));
    if (!rowsClip) {
      throw new Error(`docRows clip unavailable for ${name}`);
    }
    await page.screenshot({ path: file, clip: rowsClip });
  } else {
    await page.screenshot({ path: file, fullPage: !clip, clip });
  }
  console.log('wrote', file);
}

async function assertToolbarControlHeights(page) {
  return page.evaluate(
    ({ height, tol }) => {
      const input = document.querySelector(
        '.library-main-card-filesystem .library-list-search.search-row .input'
      );
      const searchBtn = document.querySelector(
        '.library-main-card-filesystem .library-list-search.search-row .btn-secondary'
      );
      const segmented = document.querySelector('.library-view-switcher-segmented');
      const select = document.querySelector('.library-list-toolbar-controls .custom-select-trigger');
      if (!input || !searchBtn || !segmented || !select) {
        return { ok: false, reason: 'missing toolbar nodes' };
      }
      const boxes = [input, searchBtn, segmented, select].map((el) => el.getBoundingClientRect());
      const heights = boxes.map((r) => r.height);
      const ok = heights.every((h) => Math.abs(h - height) <= tol);
      return {
        ok,
        heights: {
          input: heights[0],
          searchBtn: heights[1],
          segmented: heights[2],
          sort: heights[3],
        },
      };
    },
    { height: CONTROL_HEIGHT_PX, tol: GEOMETRY_TOLERANCE_PX }
  );
}

async function assertOverflowButtonGeometry(page) {
  return page.evaluate(
    ({ btnSize, tol }) => {
      const slot = document.querySelector('.dateisystem-content-action--overflow');
      const btn = slot?.querySelector('.icon-btn-md');
      if (!slot || !btn) return { na: true, reason: 'overflow hidden' };
      const slotStyle = getComputedStyle(slot);
      if (slotStyle.display === 'none' || slotStyle.visibility === 'hidden') {
        return { na: true, reason: 'overflow hidden' };
      }
      const br = btn.getBoundingClientRect();
      if (br.width < 1 || br.height < 1) {
        return { na: true, reason: 'overflow not visible' };
      }
      return {
        ok: Math.abs(br.width - btnSize) <= tol && Math.abs(br.height - btnSize) <= tol,
        width: br.width,
        height: br.height,
      };
    },
    { btnSize: FILESYSTEM_ICON_BUTTON_MD_PX, tol: GEOMETRY_TOLERANCE_PX }
  );
}

async function assertIconButtonGeometry(page, { rowActions = false } = {}) {
  return page.evaluate(
    ({ btnSize, tol, rowActions: needRow }) => {
      const btn = document.querySelector(
        needRow ? '.dateisystem-tree-actions .icon-btn-md' : '.dateisystem-tree-head-add.icon-btn-md'
      );
      const segmented = document.querySelector('.library-view-switcher-segmented');
      const select = document.querySelector('.library-list-toolbar-controls .custom-select-trigger');
      if (!btn || !segmented) return { ok: false, reason: 'missing nodes' };
      const br = btn.getBoundingClientRect();
      const svg = btn.querySelector('svg');
      const sr = svg?.getBoundingClientRect();
      const segR = segmented.getBoundingClientRect();
      const selR = select?.getBoundingClientRect();
      const iconCenterX = sr ? sr.left + sr.width / 2 : 0;
      const iconCenterY = sr ? sr.top + sr.height / 2 : 0;
      const btnCenterX = br.left + br.width / 2;
      const btnCenterY = br.top + br.height / 2;
      return {
        ok:
          Math.abs(br.width - btnSize) <= tol &&
          Math.abs(br.height - btnSize) <= tol &&
          Math.abs(iconCenterX - btnCenterX) <= tol &&
          Math.abs(iconCenterY - btnCenterY) <= tol &&
          Math.abs(segR.height - (selR?.height ?? segR.height)) <= tol + 1,
        deltas: {
          btnW: br.width - btnSize,
          iconDx: iconCenterX - btnCenterX,
          iconDy: iconCenterY - btnCenterY,
          segVsSelect: selR ? segR.height - selR.height : 0,
        },
      };
    },
    {
      btnSize: rowActions ? ICON_BUTTON_MD_PX : ICON_BUTTON_HEAD_PX,
      tol: GEOMETRY_TOLERANCE_PX,
      rowActions,
    }
  );
}

async function measureSearchPlaceholder(page, selector) {
  return page.evaluate(
    ({ sel, tol, gapMin }) => {
      const input = document.querySelector(sel);
      if (!input || !(input instanceof HTMLInputElement)) return { ok: false, reason: 'no input' };
      const button = input.closest('form')?.querySelector('.btn-secondary');
      const style = getComputedStyle(input);
      const padX =
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight) +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.borderRightWidth);
      const innerWidth = input.clientWidth - padX;
      const probe = document.createElement('span');
      probe.textContent = input.placeholder;
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.whiteSpace = 'nowrap';
      probe.style.font = style.font;
      probe.style.fontSize = style.fontSize;
      probe.style.fontWeight = style.fontWeight;
      probe.style.letterSpacing = style.letterSpacing;
      document.body.appendChild(probe);
      const textWidth = probe.getBoundingClientRect().width;
      probe.remove();
      const ir = input.getBoundingClientRect();
      const br = button?.getBoundingClientRect();
      const gap = br ? br.left - ir.right : null;
      const overlap = br ? ir.right > br.left - tol : false;
      return {
        ok: textWidth <= innerWidth + tol && (!br || (!overlap && gap >= gapMin - tol)),
        placeholder: input.placeholder,
        textWidth,
        innerWidth,
        inputRight: ir.right,
        buttonLeft: br?.left,
        gap,
        overlap,
      };
    },
    {
      sel: selector,
      tol: GEOMETRY_TOLERANCE_PX,
      gapMin: SEARCH_GAP_MIN_PX,
    }
  );
}

async function assertSearchRowGeometry(page) {
  return measureSearchPlaceholder(
    page,
    '.library-main-card-filesystem .library-list-search.search-row .input'
  );
}

async function assertHeaderTitleActionsGap(page, { maxGap, maxHeaderHeight }) {
  return page.evaluate(
    ({ gapMax, headerMax }) => {
      const title = document.querySelector('.dateisystem-page-title');
      const actionsRow = document.querySelector('.dateisystem-content-actions-row');
      const header = document.querySelector('.dateisystem-content-header');
      if (!title || !actionsRow || !header) {
        return { ok: false, reason: 'missing header nodes' };
      }
      const tr = title.getBoundingClientRect();
      const ar = actionsRow.getBoundingClientRect();
      const hr = header.getBoundingClientRect();
      const gap = ar.top - tr.bottom;
      return {
        ok: gap <= gapMax + 1 && gap >= -1 && hr.height <= headerMax + 1,
        gap,
        headerHeight: hr.height,
        titleBottom: tr.bottom,
        actionsTop: ar.top,
      };
    },
    { gapMax: maxGap, headerMax: maxHeaderHeight }
  );
}

async function assertTreeHeaderNoOverlap(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.dateisystem-content-header');
    const tree =
      document.querySelector('.dateisystem-sidebar .dateisystem-tree-nav') ??
      document.querySelector('.dateisystem-sidebar .dateisystem-tree');
    const sidebar = document.querySelector('.dateisystem-sidebar');
    if (!header || !tree || !sidebar) {
      return { ok: false, reason: 'missing tree or header nodes' };
    }
    const hr = header.getBoundingClientRect();
    const tr = tree.getBoundingClientRect();
    const sr = sidebar.getBoundingClientRect();
    const tol = 1;
    const intersects =
      tr.left < hr.right - tol &&
      tr.right > hr.left + tol &&
      tr.top < hr.bottom - tol &&
      tr.bottom > hr.top + tol;
    const stackedOk = tr.bottom <= hr.top + tol && sr.bottom <= hr.top + tol;
    return {
      ok: !intersects && stackedOk,
      intersects,
      stackedOk,
      treeBottom: tr.bottom,
      sidebarBottom: sr.bottom,
      headerTop: hr.top,
    };
  });
}

async function scrollDocStackRowIntoView(page) {
  const result = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.library-doc-stack-item')].find((el) => {
      const chips = [...el.querySelectorAll('.chip')].map((c) => c.textContent?.trim() ?? '');
      return chips.some((t) => t.includes('Finanzen')) || el.textContent?.includes('Finanzen');
    });
    const main = document.querySelector('.app-main');
    if (!row) return { ok: false, reason: 'no Finanzen row' };
    if (!main) return { ok: false, reason: 'no app-main' };
    const mainRect = main.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const offset = rowRect.top - mainRect.top - Math.round(mainRect.height * 0.18);
    const before = main.scrollTop;
    main.scrollTop = Math.max(0, main.scrollTop + offset);
    const after = main.scrollTop;
    const chip = row.querySelector('.chip');
    const chipRect = chip?.getBoundingClientRect();
    const chipVisible =
      chipRect != null &&
      chipRect.top >= mainRect.top &&
      chipRect.bottom <= mainRect.bottom &&
      chipRect.height > 0;
    return { ok: true, before, after, chipVisible, offset, scrolled: after !== before };
  });
  if (!result.ok) {
    throw new Error(`scrollDocStackRowIntoView: ${result.reason ?? 'failed'}`);
  }
  await page.waitForTimeout(200);
  return result;
}

async function fileMd5(filePath) {
  const buf = await readFile(filePath);
  return createHash('md5').update(buf).digest('hex');
}

async function assertSplitBorderGeometry(page) {
  return page.evaluate(
    ({ tol }) => {
      const sidebar = document.querySelector('.dateisystem-sidebar');
      const handle = document.querySelector('.dateisystem-split-handle');
      const content = document.querySelector('.dateisystem-content-pane');
      if (!sidebar || !content) return { ok: false, reason: 'missing shell parts' };
      const sr = sidebar.getBoundingClientRect();
      const hr = handle?.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      if (sr.width < 8 || getComputedStyle(handle ?? sidebar).display === 'none') {
        return { na: true, reason: 'split layout inactive' };
      }
      if (!handle) return { ok: false, reason: 'missing split handle' };
      const doubleGap = cr.left - sr.right;
      return {
        ok: doubleGap <= hr.width + tol + 2,
        sidebarRight: sr.right,
        handleLeft: hr.left,
        handleRight: hr.right,
        contentLeft: cr.left,
        shellSplitWidthPx: doubleGap,
      };
    },
    { tol: GEOMETRY_TOLERANCE_PX }
  );
}

async function prepareDokumente(page) {
  await page.goto(`${BASE}/documents`, { waitUntil: 'domcontentloaded' });
  await page.locator('.library-doc-table-card').waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForFunction(
    (minRows) => {
      const panel = document.querySelector('.library-doc-table-card .library-documents-panel');
      if (panel?.getAttribute('aria-busy') === 'true') return false;
      const rows = document.querySelectorAll(
        '.library-doc-table-card tbody tr, .library-doc-table-card .library-doc-stack-item'
      );
      return rows.length >= minRows;
    },
    MIN_DOC_ROWS,
    { timeout: 120_000 }
  );
}

async function captureDokumenteVariant(browser, spec, seed) {
  const host = new URL(BASE).hostname;
  const context = await browser.newContext({
    viewport: { width: spec.width, height: 900 },
    locale: spec.locale,
    colorScheme: spec.theme,
  });
  await addSession(context, seed.authCookie, host);
  const page = await context.newPage();
  await page.addInitScript(
    ({ lng, theme }) => {
      window.localStorage.setItem('i18nextLng', lng);
      window.localStorage.setItem('docuvate-theme', theme);
    },
    { lng: spec.lang, theme: spec.theme }
  );
  await prepareDokumente(page);

  if (spec.width <= 1280) {
    await page.locator('.library-doc-stack-list').waitFor({ state: 'visible', timeout: 20_000 });
  }

  if (spec.showDocRows) {
    await scrollDocStackRowIntoView(page);
  } else {
    await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    });
  }

  await shot(page, spec.name, { docRows: Boolean(spec.showDocRows) });
  await context.close();
}

async function captureVariant(browser, spec, seed, geometryReport) {
  const host = new URL(BASE).hostname;
  const context = await browser.newContext({
    viewport: { width: spec.width, height: 900 },
    locale: spec.locale,
    colorScheme: spec.theme,
  });
  await addSession(context, seed.authCookie, host);
  const page = await context.newPage();
  await page.addInitScript(
    ({ lng, theme }) => {
      window.localStorage.setItem('i18nextLng', lng);
      window.localStorage.setItem('docuvate-theme', theme);
    },
    { lng: spec.lang, theme: spec.theme }
  );
  await prepareOrdner(page, seed.direktFolderId, { wideSidebar: Boolean(spec.openHeaderOverflow) });

  if (spec.width <= 1280) {
    await page.locator('.library-doc-stack-list').waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForFunction(
      (minRows) => document.querySelectorAll('.library-doc-stack-item').length >= minRows,
      MIN_DOC_ROWS,
      { timeout: 60_000 }
    );
  } else {
    await page.locator('.library-table-wrap table').waitFor({ state: 'visible', timeout: 20_000 });
  }

  if (spec.focusLongName) {
    const longRow = page.locator('.dateisystem-tree-row').filter({
      has: page.locator('.sidebar-tree-name', { hasText: /Sehr langer Ordnername/ }),
    });
    await longRow.scrollIntoViewIfNeeded();
  }

  if (spec.openHeaderOverflow) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const overflow = page.locator('.dateisystem-content-action--overflow .icon-btn-md');
    await overflow.waitFor({ state: 'visible', timeout: 15_000 });
    await overflow.click();
    await page.locator('.context-menu-list').waitFor({ state: 'visible', timeout: 10_000 });
  }

  const treeHeaderOverlap =
    spec.width <= 390 && !spec.openHeaderOverflow
      ? await assertTreeHeaderNoOverlap(page)
      : { na: true, reason: 'not 390 ordner shot' };

  const headerTitleGap =
    spec.width <= 390 && !spec.openHeaderOverflow && !spec.showDocRows && !spec.dokumentePage
      ? await assertHeaderTitleActionsGap(page, {
          maxGap: HEADER_TITLE_ACTIONS_MAX_GAP_PX,
          maxHeaderHeight: HEADER_MAX_HEIGHT_390_PX,
        })
      : { na: true, reason: 'not 390 header shot' };

  if (spec.showDocRows) {
    await scrollDocStackRowIntoView(page);
  } else if (spec.width <= 390) {
    await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    });
  }

  const iconMetrics = await assertIconButtonGeometry(page, { rowActions: false });
  const direktRow = page.locator('.dateisystem-tree-row').filter({
    has: page.locator('a.dateisystem-tree-link', { hasText: /^Direkt$/ }),
  });
  if ((await direktRow.count()) > 0) {
    await direktRow.hover();
  }
  const rowIconMetrics = await assertIconButtonGeometry(page, { rowActions: true });
  const overflowMetrics = await assertOverflowButtonGeometry(page);
  const searchMetrics = await assertSearchRowGeometry(page);
  const splitMetrics = await assertSplitBorderGeometry(page);
  const controlHeights = await assertToolbarControlHeights(page);

  geometryReport.shots.push({
    shot: spec.name,
    iconButton: iconMetrics,
    treeRowIconButton: rowIconMetrics,
    overflowButton: overflowMetrics,
    searchRow: searchMetrics,
    splitBorder: splitMetrics,
    controlHeights,
    treeHeaderOverlap,
    headerTitleGap,
  });

  await shot(page, spec.name, { docRows: Boolean(spec.showDocRows) });

  if (spec.showDocRows) {
    const baseName = spec.name.replace('-rows.png', '.png');
    const basePath = path.join(OUT, baseName);
    try {
      const [rowsHash, baseHash] = await Promise.all([fileMd5(path.join(OUT, spec.name)), fileMd5(basePath)]);
      if (rowsHash === baseHash) {
        geometryReport.shots[geometryReport.shots.length - 1].rowsDistinctFromBase = {
          ok: false,
          rowsHash,
          baseHash,
        };
      } else {
        geometryReport.shots[geometryReport.shots.length - 1].rowsDistinctFromBase = {
          ok: true,
          rowsHash,
          baseHash,
        };
      }
    } catch (err) {
      geometryReport.shots[geometryReport.shots.length - 1].rowsDistinctFromBase = {
        ok: false,
        reason: String(err),
      };
    }
  }

  await context.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const seed = refreshSeed();
  const geometryReport = {
    capturedAt: new Date().toISOString(),
    seedDocumentCount: seed.documentCount,
    shots: [],
  };

  const browser = await chromium.launch({ headless: true });

  for (const spec of [
    { name: 'ordner-toolbar-de-light-1440.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1440 },
    { name: 'ordner-toolbar-de-dark-1440.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 1440 },
    { name: 'ordner-toolbar-de-light-1280.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1280 },
    { name: 'ordner-toolbar-de-dark-1280.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 1280 },
    { name: 'ordner-toolbar-de-light-1024.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1024 },
    { name: 'ordner-toolbar-de-dark-1024.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 1024 },
    { name: 'ordner-toolbar-de-light-390.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 390 },
    { name: 'ordner-toolbar-de-dark-390.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 390 },
    {
      name: 'ordner-toolbar-de-light-390-overflow-menu.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'light',
      width: 390,
      openHeaderOverflow: true,
    },
    {
      name: 'ordner-toolbar-de-dark-390-overflow-menu.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'dark',
      width: 390,
      openHeaderOverflow: true,
    },
    {
      name: 'ordner-toolbar-de-light-390-rows.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'light',
      width: 390,
      showDocRows: true,
    },
    {
      name: 'ordner-toolbar-de-dark-390-rows.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'dark',
      width: 390,
      showDocRows: true,
    },
  ]) {
    await captureVariant(browser, spec, seed, geometryReport);
  }

  for (const spec of [
    { name: 'dokumente-de-light-1440.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 1440, dokumentePage: true },
    { name: 'dokumente-de-dark-1440.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 1440, dokumentePage: true },
    { name: 'dokumente-de-light-390.png', locale: 'de-DE', lang: 'de', theme: 'light', width: 390, dokumentePage: true },
    { name: 'dokumente-de-dark-390.png', locale: 'de-DE', lang: 'de', theme: 'dark', width: 390, dokumentePage: true },
    {
      name: 'dokumente-de-light-390-rows.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'light',
      width: 390,
      dokumentePage: true,
      showDocRows: true,
    },
    {
      name: 'dokumente-de-dark-390-rows.png',
      locale: 'de-DE',
      lang: 'de',
      theme: 'dark',
      width: 390,
      dokumentePage: true,
      showDocRows: true,
    },
  ]) {
    await captureDokumenteVariant(browser, spec, seed);
  }

  await browser.close();

  await writeFile(path.join(OUT, 'toolbar-geometry.json'), JSON.stringify(geometryReport, null, 2));
  console.log('wrote', path.join(OUT, 'toolbar-geometry.json'));
  const geometryFailed = geometryReport.shots.some((entry) => {
    const parts = [
      entry.iconButton,
      entry.treeRowIconButton,
      entry.overflowButton,
      entry.searchRow,
      entry.splitBorder,
      entry.controlHeights,
      entry.treeHeaderOverlap,
      entry.headerTitleGap,
      entry.rowsDistinctFromBase,
    ].filter(Boolean);
    return parts.some((p) => p && p.ok === false && !p.na);
  });
  if (geometryFailed) {
    process.exitCode = 1;
    console.error('Geometry checks reported failures (see toolbar-geometry.json); screenshots were still written.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
