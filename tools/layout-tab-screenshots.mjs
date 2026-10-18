#!/usr/bin/env node
/**
 * Capture Layout tab screenshots in the real app (synthetic PDF fixtures only).
 * Prereq: stack up, `node scripts/seed-e2e-smoke-user.mjs` (WEB_ORIGIN=http://localhost:5173).
 * Set LAYOUT_SCREENSHOT_OUT to deliver artifacts outside the repo.
 */
import { chromium } from 'playwright';
import { join } from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execSync, spawnSync } from 'node:child_process';

const WEB = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const OUT = process.env.LAYOUT_SCREENSHOT_OUT ?? join(process.cwd(), 'artifacts/screenshots/layout-ir');
const AUTH = `${WEB}/api/auth`;
const API = `${WEB}/api/v1`;
const ORIGIN = new URL(WEB).origin;
const HEAD_SHA = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const authHeaders = { Origin: ORIGIN, Referer: `${ORIGIN}/` };

function syntheticFixturesDir() {
  const dir = mkdtempSync(join(tmpdir(), 'docuvate-layout-fixtures-'));
  const script = `
import sys
from pathlib import Path
sys.path.insert(0, ${JSON.stringify(join(process.cwd(), 'apps/worker/tests'))})
from synthetic_layout_pdfs import (
  delivery_note_table_pdf,
  delivery_note_multipage_pdf,
  form_disclosure_pdf,
  two_column_words_pdf,
)
root = Path(${JSON.stringify(dir)})
root.mkdir(parents=True, exist_ok=True)
(root / "sample_delivery_note.pdf").write_bytes(delivery_note_table_pdf())
(root / "sample_multipage.pdf").write_bytes(delivery_note_multipage_pdf())
(root / "sample_form_disclosure.pdf").write_bytes(form_disclosure_pdf())
(root / "sample_two_column.pdf").write_bytes(two_column_words_pdf())
`;
  const result = spawnSync('python3', ['-c', script], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr || 'failed to write synthetic PDF fixtures');
  }
  return dir;
}

const FIXTURES = syntheticFixturesDir();

const email = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const password = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';

const FILES = [
  'sample_delivery_note.pdf',
  'sample_multipage.pdf',
  'sample_form_disclosure.pdf',
  'sample_two_column.pdf',
];

/** @type {Array<{ out: string; width: number; height: number; theme: 'light' | 'dark'; file: string; exportMenu?: boolean; zoom200?: boolean; zoomScroll?: boolean; textTab?: boolean; layout?: boolean }>} */
const SHOTS = [
  { out: 'form-1280-light.png', width: 1280, height: 900, theme: 'light', file: 'sample_form_disclosure.pdf' },
  { out: 'form-1280-dark.png', width: 1280, height: 900, theme: 'dark', file: 'sample_form_disclosure.pdf' },
  { out: 'delivery-note-1280-light.png', width: 1280, height: 900, theme: 'light', file: 'sample_delivery_note.pdf' },
  { out: 'delivery-note-1280-dark.png', width: 1280, height: 900, theme: 'dark', file: 'sample_delivery_note.pdf' },
  { out: 'two-column-1280-light.png', width: 1280, height: 900, theme: 'light', file: 'sample_two_column.pdf' },
  { out: 'two-column-1280-dark.png', width: 1280, height: 900, theme: 'dark', file: 'sample_two_column.pdf' },
  {
    out: 'export-menu-1280-light.png',
    width: 1280,
    height: 900,
    theme: 'light',
    file: 'sample_delivery_note.pdf',
    exportMenu: true,
  },
  {
    out: 'export-menu-1280-dark.png',
    width: 1280,
    height: 900,
    theme: 'dark',
    file: 'sample_delivery_note.pdf',
    exportMenu: true,
  },
  {
    out: 'zoom-200-scroll-1280-light.png',
    width: 1280,
    height: 900,
    theme: 'light',
    file: 'sample_two_column.pdf',
    zoom200: true,
    zoomScroll: true,
  },
  {
    out: 'zoom-200-scroll-1280-dark.png',
    width: 1280,
    height: 900,
    theme: 'dark',
    file: 'sample_two_column.pdf',
    zoom200: true,
    zoomScroll: true,
  },
  {
    out: 'text-tab-page-link-1280-light.png',
    width: 1280,
    height: 900,
    theme: 'light',
    file: 'sample_multipage.pdf',
    textTab: true,
  },
  {
    out: 'text-tab-page-link-1280-dark.png',
    width: 1280,
    height: 900,
    theme: 'dark',
    file: 'sample_multipage.pdf',
    textTab: true,
  },
  {
    out: 'text-tab-page-2-1280-light.png',
    width: 1280,
    height: 900,
    theme: 'light',
    file: 'sample_multipage.pdf',
    textTab: true,
    textTabPage: 2,
  },
  {
    out: 'text-tab-page-2-1280-dark.png',
    width: 1280,
    height: 900,
    theme: 'dark',
    file: 'sample_multipage.pdf',
    textTab: true,
    textTabPage: 2,
  },
  {
    out: 'layout-tab-page-2-1280-light.png',
    width: 1280,
    height: 900,
    theme: 'light',
    file: 'sample_multipage.pdf',
    layoutTabPage: 2,
  },
  {
    out: 'layout-tab-page-2-1280-dark.png',
    width: 1280,
    height: 900,
    theme: 'dark',
    file: 'sample_multipage.pdf',
    layoutTabPage: 2,
  },
  { out: 'form-390-light.png', width: 390, height: 844, theme: 'light', file: 'sample_form_disclosure.pdf' },
  { out: 'form-390-dark.png', width: 390, height: 844, theme: 'dark', file: 'sample_form_disclosure.pdf' },
  { out: 'delivery-note-390-light.png', width: 390, height: 844, theme: 'light', file: 'sample_delivery_note.pdf' },
  { out: 'delivery-note-390-dark.png', width: 390, height: 844, theme: 'dark', file: 'sample_delivery_note.pdf' },
  { out: 'two-column-390-light.png', width: 390, height: 844, theme: 'light', file: 'sample_two_column.pdf' },
  { out: 'two-column-390-dark.png', width: 390, height: 844, theme: 'dark', file: 'sample_two_column.pdf' },
  {
    out: 'export-menu-390-light.png',
    width: 390,
    height: 844,
    theme: 'light',
    file: 'sample_delivery_note.pdf',
    exportMenu: true,
  },
  {
    out: 'export-menu-390-dark.png',
    width: 390,
    height: 844,
    theme: 'dark',
    file: 'sample_delivery_note.pdf',
    exportMenu: true,
  },
  {
    out: 'text-tab-page-link-390-light.png',
    width: 390,
    height: 844,
    theme: 'light',
    file: 'sample_multipage.pdf',
    textTab: true,
  },
  {
    out: 'text-tab-page-link-390-dark.png',
    width: 390,
    height: 844,
    theme: 'dark',
    file: 'sample_multipage.pdf',
    textTab: true,
  },
];

async function setLocaleDe(context, page) {
  await context.request.patch(`${API}/settings`, {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: { locale: 'de' },
  });
  await page.evaluate(() => localStorage.setItem('docuvate.locale', 'de'));
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function setThemeViaAccountMenu(page, theme) {
  await page.locator('.user-account-menu-trigger').click();
  const panel = page.locator('.user-account-menu-panel');
  await panel.waitFor({ state: 'visible', timeout: 15_000 });
  const segment = theme === 'dark' ? /Dunkel/i : /Hell/i;
  await panel.getByRole('radio', { name: segment }).click();
  await page.waitForFunction(
    (t) => document.documentElement.getAttribute('data-docuvate-theme') === t,
    theme,
    { timeout: 15_000 }
  );
  await page.keyboard.press('Escape');
}

async function apiLogin(context) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let res = await context.request.post(`${AUTH}/sign-in/email`, {
      headers: authHeaders,
      data: { email, password },
    });
    if (res.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!res.ok()) {
      await context.request.post(`${AUTH}/sign-up/email`, {
        headers: authHeaders,
        data: { email, password, name: 'Alex Testmann' },
      });
      res = await context.request.post(`${AUTH}/sign-in/email`, {
        headers: authHeaders,
        data: { email, password },
      });
    }
    if (res.ok()) return;
    if (res.status() === 429) continue;
    throw new Error(`login failed ${res.status()}`);
  }
  throw new Error('login rate limited');
}

async function listDocuments(request) {
  const res = await request.get(`${API}/documents`, { headers: authHeaders });
  if (!res.ok()) throw new Error(`list documents ${res.status()}`);
  const data = await res.json();
  return data.items ?? [];
}

async function waitDocumentReady(request, id) {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const res = await request.get(`${API}/documents/${id}`, { headers: authHeaders });
    if (!res.ok()) throw new Error(`get document ${res.status()}`);
    const doc = await res.json();
    if (doc.status === 'ready') return doc;
    if (doc.status === 'failed') throw new Error(`extraction failed for ${id}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`timeout waiting for document ${id}`);
}

async function uploadFixture(request, filename) {
  const buffer = readFileSync(join(FIXTURES, filename));
  const res = await request.post(`${API}/documents`, {
    headers: authHeaders,
    multipart: {
      file: {
        name: filename,
        mimeType: 'application/pdf',
        buffer,
      },
    },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`upload ${filename} ${res.status()}: ${body}`);
  }
  const doc = await res.json();
  return waitDocumentReady(request, doc.id);
}

/** @returns {Promise<Record<string, string>>} filename → document id */
async function ensureAllDocuments(request) {
  const byFilename = new Map();
  for (const doc of await listDocuments(request)) {
    if (FILES.includes(doc.filename)) {
      byFilename.set(doc.filename, doc.id);
    }
  }
  for (const file of FILES) {
    let id = byFilename.get(file);
    if (!id) {
      const doc = await uploadFixture(request, file);
      id = doc.id;
      byFilename.set(file, id);
    } else {
      const doc = await waitDocumentReady(request, id);
      byFilename.set(file, doc.id);
    }
  }
  return Object.fromEntries(byFilename);
}

async function openDocumentDetail(page, docIds, filename) {
  const id = docIds[filename];
  if (!id) throw new Error(`missing document id for ${filename}`);
  await page.goto(`${WEB}/documents/${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/documents\/[0-9a-f-]+/i, { timeout: 60_000 });
}

async function openLayoutTab(page) {
  const layoutBtn = page.getByRole('button', { name: /^Layout$/i });
  await layoutBtn.waitFor({ state: 'visible', timeout: 300_000 });
  await layoutBtn.click();
  const frame = page.locator('.layout-ir-html-frame');
  await frame.waitFor({ state: 'visible', timeout: 180_000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('.layout-ir-html-frame');
    return el instanceof HTMLIFrameElement && el.offsetHeight >= 120;
  }, { timeout: 180_000 });
  await page.waitForTimeout(800);
}

async function setLayoutZoom200(page) {
  const zoomBtn = page.getByRole('button', { name: /200\s*%/i });
  await zoomBtn.waitFor({ state: 'visible', timeout: 60_000 });
  await zoomBtn.click();
  await page.waitForTimeout(600);
}

async function scrollLayoutPanel(page) {
  const body = page.locator('.extracted-text-body');
  await body.evaluate((el) => {
    const maxLeft = el.scrollWidth - el.clientWidth;
    const maxTop = el.scrollHeight - el.clientHeight;
    el.scrollLeft = maxLeft > 0 ? maxLeft : 0;
    el.scrollTop = maxTop > 0 ? Math.min(120, maxTop) : 0;
  });
  await page.waitForTimeout(400);
  const scrolled = await body.evaluate((el) => ({
    scrollLeft: el.scrollLeft,
    scrollTop: el.scrollTop,
  }));
  if (scrolled.scrollLeft <= 0 || scrolled.scrollTop <= 0) {
    throw new Error(
      `layout panel scroll expected scrollLeft>0 and scrollTop>0, got ${JSON.stringify(scrolled)}`
    );
  }
}

async function goToViewerPage(page, targetPage) {
  if (targetPage <= 1) return;
  const status = page.getByText(new RegExp(`Seite\\s+\\d+\\s+von\\s+\\d+`, 'i'));
  await status.waitFor({ state: 'visible', timeout: 60_000 });
  for (let i = 1; i < targetPage; i += 1) {
    await page.getByRole('button', { name: /Nächste Seite/i }).click();
    await page.waitForTimeout(400);
  }
  await page.getByText(new RegExp(`Seite\\s+${targetPage}\\s+von`, 'i')).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

async function measureExportMenuItemHeight(page) {
  const btn = page.locator('.context-menu-root .context-menu-btn').first();
  await btn.waitFor({ state: 'visible', timeout: 30_000 });
  return btn.evaluate((el) => Math.round(el.getBoundingClientRect().height));
}

async function openTextTab(page) {
  const textBtn = page.getByRole('button', { name: /^Text$/i });
  await textBtn.waitFor({ state: 'visible', timeout: 60_000 });
  await textBtn.click();
  await page.locator('.extracted-text-body').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(400);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'de-DE' });
  await apiLogin(context);
  const docIds = await ensureAllDocuments(context.request);
  const page = await context.newPage();
  await page.goto(`${WEB}/documents`, { waitUntil: 'domcontentloaded' });
  await setLocaleDe(context, page);

  const manifestFiles = [];
  const exportMenuItemHeightPx = {};
  for (const shot of SHOTS) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await openDocumentDetail(page, docIds, shot.file);
    await setThemeViaAccountMenu(page, shot.theme);
    if (shot.textTabPage) {
      await goToViewerPage(page, shot.textTabPage);
    }
    if (shot.layoutTabPage) {
      await goToViewerPage(page, shot.layoutTabPage);
    }
    if (shot.textTab) {
      await openTextTab(page);
    } else if (shot.layoutTabPage) {
      await openLayoutTab(page);
    } else {
      await openLayoutTab(page);
      if (shot.zoom200) {
        await setLayoutZoom200(page);
      }
      if (shot.zoomScroll) {
        await scrollLayoutPanel(page);
      }
      if (shot.exportMenu) {
        await page.getByRole('button', { name: /^Exportieren$/i }).click();
        await page.locator('.context-menu-root .context-menu-list[role="menu"]').waitFor({ timeout: 30_000 });
        await page.waitForTimeout(300);
        const heightPx = await measureExportMenuItemHeight(page);
        exportMenuItemHeightPx[`${shot.width}-${shot.theme}`] = heightPx;
        if (heightPx < 40) {
          throw new Error(`export menu item height ${heightPx}px < 40 at ${shot.out}`);
        }
      }
    }
    const outPath = join(OUT, shot.out);
    await page.screenshot({ path: outPath, fullPage: false });
    manifestFiles.push(shot.out);
    console.log('wrote', outPath);
  }

  writeFileSync(
    join(OUT, 'manifest.json'),
    `${JSON.stringify({ headSha: HEAD_SHA, files: manifestFiles, exportMenuItemHeightPx }, null, 2)}\n`
  );
  console.log('exportMenuItemHeightPx', JSON.stringify(exportMenuItemHeightPx));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
