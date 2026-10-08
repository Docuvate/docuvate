/**
 * PR UX screenshot capture — API sign-in (session cookie on Playwright context).
 * Run: pnpm --filter @docuvate/web dev + docker compose (see docs/design-tokens.md)
 *   node scripts/screenshots/capture-screenshots.mjs
 *
 * Destructive API cleanup runs only for @test.local users against localhost (see assertScreenshotSafety).
 */
import { chromium } from 'playwright';
import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = '/opt/cursor/artifacts/e2e-ux-fixes';
const STORE_OUT = '/cursor/stores/self/artifacts/e2e-ux-fixes';
const PR80_SHOTS = '/cursor/stores/self/pr80-shots';
const PROJEKT_MAPPE_NAME = 'Projekt';
const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';
const API = `${BASE}/api/v1`;
const AUTH = `${BASE}/api/auth`;
const ORIGIN = new URL(BASE).origin;

const authHeaders = {
  Origin: ORIGIN,
  Referer: `${ORIGIN}/`,
};

const EMAIL = process.env.SCREENSHOT_USER_EMAIL ?? 'screenshot-user@test.local';
const PASSWORD = process.env.SCREENSHOT_USER_PASSWORD ?? 'ScreenshotUser2026!';
const NAME = 'Screenshot Nutzer';

const SEEDS_DIR = path.join(REPO_ROOT, 'scripts/screenshots/seeds');
/** Set by {@link ensureProjektMappe} for direct navigation to Mappe Projekt. */
let projektMappeId = null;
let projektDirektFolderId = null;
let projektHausFolderId = null;

const PDF_SEEDS = [
  { file: 'lieferschein-nordwind-gmbh.pdf', title: 'Lieferschein Nordwind GmbH' },
  { file: 'protokoll-team-alpha-q1.pdf', title: 'Protokoll Team Alpha Q1' },
  { file: 'vertrag-beispiel-consulting.pdf', title: 'Vertrag Beispiel Consulting' },
];

const LIBRARY_SEED_FOLDER = 'Ablage Studio West';

function assertScreenshotSafety() {
  if (!EMAIL.endsWith('@test.local')) {
    throw new Error(
      `Refusing test-seed cleanup: SCREENSHOT_USER_EMAIL must end with @test.local (got "${EMAIL}")`
    );
  }
  const host = new URL(BASE).hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const allowRemote = process.env.SCREENSHOT_ALLOW_REMOTE === '1';
  if (!isLocal && !allowRemote) {
    throw new Error(
      `Refusing test-seed cleanup: SCREENSHOT_BASE_URL host must be localhost or 127.0.0.1 (got "${host}") unless SCREENSHOT_ALLOW_REMOTE=1`
    );
  }
}

assertScreenshotSafety();

await mkdir(OUT, { recursive: true });
await mkdir(STORE_OUT, { recursive: true });
await mkdir(PR80_SHOTS, { recursive: true });

const HIDE_FOLDER_MAX = 1199;
const HIDE_STATUS_MAX = 1099;
const KEEP_MAPPE_NAMES = new Set(['Projekt', 'Projekt Atlas', 'Archiv Linden']);

let browserLocale = 'de-DE';
let browser = await chromium.launch({ args: [`--lang=${browserLocale}`] });
let context = await browser.newContext({ locale: browserLocale });
let page = await context.newPage();
let sessionReady = false;

async function relaunchBrowserLocale(localeTag) {
  if (localeTag === browserLocale) return;
  const cookies = await context.cookies();
  await context.close();
  await browser.close();
  browserLocale = localeTag;
  browser = await chromium.launch({ args: [`--lang=${browserLocale}`] });
  context = await browser.newContext({ locale: browserLocale });
  page = await context.newPage();
  if (cookies.length > 0) {
    await context.addCookies(cookies);
    sessionReady = cookies.some((c) => c.name.includes('session'));
  }
}

function parseSetCookieHeader(setCookie) {
  if (!setCookie) return null;
  const first = setCookie.split(/,(?=\s*[^;]+=)/)[0];
  const [pair] = first.split(';');
  const eq = pair.indexOf('=');
  if (eq <= 0) return null;
  return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
}

async function ensureScreenshotUser() {
  const signInProbe = await context.request.post(`${AUTH}/sign-in/email`, {
    headers: authHeaders,
    data: { email: EMAIL, password: PASSWORD },
  });
  if (signInProbe.ok()) {
    return;
  }
  const signUp = await context.request.post(`${AUTH}/sign-up/email`, {
    headers: authHeaders,
    data: { email: EMAIL, password: PASSWORD, name: NAME },
  });
  if (!signUp.ok() && signUp.status() !== 422 && signUp.status() !== 429) {
    const body = await signUp.text();
    throw new Error(`sign-up failed ${signUp.status()}: ${body.slice(0, 200)}`);
  }
}

async function apiLogin() {
  await ensureScreenshotUser();
  const signIn = await context.request.post(`${AUTH}/sign-in/email`, {
    headers: authHeaders,
    data: { email: EMAIL, password: PASSWORD },
  });
  if (!signIn.ok()) {
    throw new Error(`sign-in failed ${signIn.status()}: ${await signIn.text()}`);
  }
  const setCookie = signIn.headers()['set-cookie'];
  const parsed = parseSetCookieHeader(setCookie);
  if (!parsed?.name.includes('session')) {
    throw new Error(`missing session Set-Cookie from sign-in: ${setCookie ?? '(none)'}`);
  }
  const url = new URL(BASE);
  await context.addCookies([
    {
      name: parsed.name,
      value: parsed.value,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  sessionReady = true;
}

/** Test-seed cleanup: delete all tags for the screenshot @test.local user. */
async function purgeScreenshotTags() {
  const list = await context.request.get(`${API}/tags`);
  if (!list.ok()) {
    return;
  }
  const data = await list.json();
  for (const tag of data.items ?? []) {
    const id = tag.id;
    if (!id) continue;
    await context.request.delete(`${API}/tags/${id}`);
  }
}

/** Test-seed cleanup: delete all documents for the screenshot @test.local user. */
async function purgeScreenshotDocuments() {
  for (;;) {
    const list = await context.request.get(`${API}/documents`);
    if (!list.ok()) {
      throw new Error(`purge list failed ${list.status()}: ${(await list.text()).slice(0, 120)}`);
    }
    const data = await list.json();
    const items = data.items ?? [];
    if (items.length === 0) {
      return;
    }
    for (const item of items) {
      const del = await context.request.delete(`${API}/documents/${item.id}`);
      if (!del.ok()) {
        throw new Error(`purge delete ${item.id} failed ${del.status()}`);
      }
    }
  }
}

/** Test-seed cleanup: remove loose (non-mappe) folders for the screenshot user. */
async function purgeLooseScreenshotFolders() {
  for (let pass = 0; pass < 40; pass += 1) {
    const foldersRes = await context.request.get(`${API}/folders`);
    if (!foldersRes.ok()) break;
    const items = (await foldersRes.json()).items ?? [];
    const loose = items.filter((f) => !f.mappeId);
    if (loose.length === 0) break;
    const leaves = loose.filter((f) => !loose.some((other) => other.parentId === f.id));
    if (leaves.length === 0) break;
    for (const folder of leaves) {
      await context.request.delete(`${API}/folders/${folder.id}`);
    }
  }
}

async function findOrCreateLooseFolder(name) {
  const foldersRes = await context.request.get(`${API}/folders`);
  const items = foldersRes.ok() ? ((await foldersRes.json()).items ?? []) : [];
  const existing = items.find((f) => !f.mappeId && f.name === name);
  if (existing) return existing.id;
  const created = await context.request.post(`${API}/folders`, { data: { name } });
  if (!created.ok()) {
    throw new Error(`folder create ${name} failed ${created.status()}`);
  }
  return (await created.json()).id;
}

async function findOrCreateMappe(name) {
  const list = await context.request.get(`${API}/mappen`);
  const items = list.ok() ? ((await list.json()).items ?? []) : [];
  let mappe = items.find((m) => m.name === name);
  if (mappe) return mappe;
  const created = await context.request.post(`${API}/mappen`, { data: { name } });
  if (!created.ok()) {
    throw new Error(`mappe create ${name} failed ${created.status()}`);
  }
  mappe = await created.json();
  return mappe;
}

/** Test-seed cleanup: delete mappen outside the Projekt screenshot allowlist. */
async function purgeLegacyMappen() {
  const list = await context.request.get(`${API}/mappen`);
  if (!list.ok()) return;
  const items = (await list.json()).items ?? [];
  for (const mappe of items) {
    if (KEEP_MAPPE_NAMES.has(mappe.name)) continue;
    await clearMappeFolders(mappe.id);
    const del = await context.request.delete(`${API}/mappen/${mappe.id}`);
    if (!del.ok()) {
      throw new Error(`purge mappe ${mappe.name} failed ${del.status()}`);
    }
  }
}

async function findOrCreateMappeFolder({ name, mappeId, parentId = null }) {
  const foldersRes = await context.request.get(`${API}/folders`);
  const items = foldersRes.ok() ? ((await foldersRes.json()).items ?? []) : [];
  const existing = items.find(
    (f) => f.mappeId === mappeId && f.name === name && (f.parentId ?? null) === parentId
  );
  if (existing) return existing;
  const created = await context.request.post(`${API}/folders`, {
    data: { name, mappeId, parentId },
  });
  if (!created.ok()) {
    throw new Error(`folder ${name} in mappe failed ${created.status()}`);
  }
  return await created.json();
}

/** Test-seed cleanup: remove all folders inside a mappe before re-seeding structure. */
async function clearMappeFolders(mappeId) {
  for (let pass = 0; pass < 30; pass += 1) {
    const foldersRes = await context.request.get(`${API}/folders`);
    if (!foldersRes.ok()) break;
    const inMappe = ((await foldersRes.json()).items ?? []).filter((f) => f.mappeId === mappeId);
    if (inMappe.length === 0) break;
    const leaves = inMappe.filter((f) => !inMappe.some((other) => other.parentId === f.id));
    for (const folder of leaves) {
      await context.request.delete(`${API}/folders/${folder.id}`);
    }
  }
}

async function seedDocuments() {
  await purgeScreenshotDocuments();
  await purgeScreenshotTags();
  await purgeLooseScreenshotFolders();

  const folderId = await findOrCreateLooseFolder(LIBRARY_SEED_FOLDER);

  const tagIds = {};
  for (const spec of [
    { key: 'vertrag', name: 'Vertrag', color: '#2563eb' },
    { key: 'lieferant', name: 'Lieferant', color: '#0d9488' },
  ]) {
    const tagRes = await context.request.post(`${API}/tags`, {
      data: { name: spec.name, color: spec.color },
    });
    if (tagRes.ok()) {
      tagIds[spec.key] = (await tagRes.json()).id;
    }
  }

  for (const doc of PDF_SEEDS) {
    const buffer = await readFile(path.join(SEEDS_DIR, doc.file));
    const upload = await context.request.post(`${API}/documents`, {
      multipart: {
        file: {
          name: doc.file,
          mimeType: 'application/pdf',
          buffer,
        },
      },
    });
    if (!upload.ok()) {
      throw new Error(`seed upload failed ${upload.status()}: ${(await upload.text()).slice(0, 200)}`);
    }
    const uploaded = await upload.json();
    await context.request.patch(`${API}/documents/${uploaded.id}`, {
      data: {
        title: doc.title,
        ...(folderId ? { folderId } : {}),
      },
    });
    const labelKey =
      doc.file === 'vertrag-beispiel-consulting.pdf'
        ? 'vertrag'
        : doc.file === 'lieferschein-nordwind-gmbh.pdf'
          ? 'lieferant'
          : null;
    if (labelKey && tagIds[labelKey]) {
      await context.request.post(`${API}/documents/${uploaded.id}/tags/${tagIds[labelKey]}`);
    }
  }
}

async function ensureProjektMappe() {
  await purgeLooseScreenshotFolders();
  await purgeLegacyMappen();

  const projekt = await findOrCreateMappe(PROJEKT_MAPPE_NAME);
  await clearMappeFolders(projekt.id);
  const direkt = await findOrCreateMappeFolder({ name: 'Direkt', mappeId: projekt.id, parentId: null });
  await findOrCreateMappeFolder({
    name: 'Rechnungen',
    mappeId: projekt.id,
    parentId: null,
  });
  const haus = await findOrCreateMappeFolder({ name: 'Haus', mappeId: projekt.id, parentId: null });
  projektDirektFolderId = direkt.id;
  projektHausFolderId = haus.id;

  const atlas = await findOrCreateMappe('Projekt Atlas');
  await clearMappeFolders(atlas.id);
  await findOrCreateMappeFolder({ name: 'Angebote', mappeId: atlas.id, parentId: null });

  const linden = await findOrCreateMappe('Archiv Linden');
  await clearMappeFolders(linden.id);

  const hausFolder = haus;

  const allDocs = await context.request.get(`${API}/documents`);
  const items = allDocs.ok() ? ((await allDocs.json()).items ?? []) : [];
  const titles = new Set(PDF_SEEDS.map((s) => s.title));
  const seeded = items.filter((doc) => titles.has(doc.title));
  if (seeded.length < PDF_SEEDS.length) {
    throw new Error(`expected ${PDF_SEEDS.length} seeded docs, found ${seeded.length}`);
  }
  for (const doc of seeded) {
    const patch = await context.request.patch(`${API}/documents/${doc.id}`, {
      data: { folderId: hausFolder.id },
    });
    if (!patch.ok()) {
      throw new Error(`move ${doc.title} to ${PROJEKT_MAPPE_NAME}/Haus failed ${patch.status()}`);
    }
  }

  projektMappeId = projekt.id;
  return projekt.id;
}

async function openProjektMappeView() {
  if (!projektMappeId) {
    throw new Error('projektMappeId missing — call ensureProjektMappe() first');
  }
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
    localStorage.setItem('docuvate.dateisystem.sidebarWidth', '220');
  });
  await page.goto(`${BASE}/filesystem/containers/${projektMappeId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.library-main-card-filesystem', { timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.library-table tbody tr').length > 0,
    null,
    { timeout: 90_000 }
  );
}

async function openProjektDirektFolderView() {
  if (!projektDirektFolderId) {
    throw new Error('projektDirektFolderId missing — call ensureProjektMappe() first');
  }
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
    localStorage.setItem('docuvate.dateisystem.sidebarWidth', '220');
  });
  await page.goto(`${BASE}/filesystem/folders/${projektDirektFolderId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.library-main-card-filesystem', { timeout: 20000 });
}

async function openProjektHausFolderView() {
  if (!projektHausFolderId) {
    throw new Error('projektHausFolderId missing — call ensureProjektMappe() first');
  }
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
    localStorage.setItem('docuvate.dateisystem.sidebarWidth', '220');
  });
  await page.goto(`${BASE}/filesystem/folders/${projektHausFolderId}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.library-main-card-filesystem', { timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.library-table tbody tr').length > 0,
    null,
    { timeout: 90_000 }
  );
}

async function assertLibraryToolbarLayout(label, options = {}) {
  const { expectViewControls = false, minSearchWidth = 240 } = options;
  const result = await page.evaluate(
    ({ expectViewControls, minSearchWidth }) => {
      const toolbar = document.querySelector('.library-list-toolbar');
      const input = toolbar?.querySelector('.library-list-search input');
      if (!toolbar || !input) {
        return { ok: false, reason: 'missing toolbar or search input' };
      }
      const inputRect = input.getBoundingClientRect();
      if (inputRect.width + 0.5 < minSearchWidth) {
        return {
          ok: false,
          reason: `search field ${Math.round(inputRect.width)}px wide (need ≥${minSearchWidth}px)`,
        };
      }

      const nodes = [
        input,
        toolbar.querySelector('.library-list-search button[type="submit"]'),
        toolbar.querySelector('.library-filter-toggle'),
        expectViewControls ? toolbar.querySelector('.view-switcher') : null,
        expectViewControls
          ? toolbar.querySelector('.library-list-toolbar-controls .custom-select-trigger')
          : null,
      ].filter((node) => node instanceof HTMLElement);

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i].getBoundingClientRect();
          const b = nodes[j].getBoundingClientRect();
          const separated =
            a.right <= b.left + 1 ||
            b.right <= a.left + 1 ||
            a.bottom <= b.top + 1 ||
            b.bottom <= a.top + 1;
          if (!separated) {
            return {
              ok: false,
              reason: `bounding boxes overlap (${nodes[i].className} × ${nodes[j].className})`,
            };
          }
        }
      }

      if (expectViewControls) {
        const viewSwitcher = toolbar.querySelector('.view-switcher');
        if (viewSwitcher) {
          const viewRect = viewSwitcher.getBoundingClientRect();
          if (inputRect.bottom > viewRect.top + 1) {
            return { ok: false, reason: 'view/sort row overlaps search row' };
          }
        }
      }

      return { ok: true };
    },
    { expectViewControls, minSearchWidth }
  );
  if (!result.ok) {
    throw new Error(`${label}: toolbar layout — ${result.reason}`);
  }
}

async function assertFilesystemContentPaneWidth(label, minRatio = 0.6) {
  const result = await page.evaluate((minRatio) => {
    const main = document.querySelector('.app-main');
    const pane = document.querySelector('.dateisystem-content-pane');
    if (!main || !pane) {
      return { ok: false, reason: 'missing app-main or content pane' };
    }
    const ratio = pane.clientWidth / main.clientWidth;
    if (ratio + 0.001 < minRatio) {
      return {
        ok: false,
        reason: `content pane ${(ratio * 100).toFixed(1)}% of main (need ≥${minRatio * 100}%)`,
      };
    }
    return { ok: true };
  }, minRatio);
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertBulkSelectionHintLines(label) {
  const result = await page.evaluate(() => {
    const hint = document.querySelector('.library-bulk-idle-hint, .library-bulk-bar .muted');
    if (!hint) return { ok: true };
    const lineHeight = parseFloat(getComputedStyle(hint).lineHeight) || 16;
    const lines = Math.round(hint.getBoundingClientRect().height / lineHeight);
    if (lines > 3) {
      return { ok: false, reason: `bulk hint ~${lines} lines (layout too narrow?)` };
    }
    return { ok: true };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertLibrarySearchRowOneLine(label) {
  const result = await page.evaluate(() => {
    const form = document.querySelector('.library-list-search.library-search-row');
    if (!form) return { ok: true };
    const nodes = [
      form.querySelector('input'),
      form.querySelector('.library-filter-toggle'),
      form.querySelector('button[type="submit"]'),
    ].filter((n) => n instanceof HTMLElement);
    const tops = nodes.map((n) => n.getBoundingClientRect().top);
    if (tops.length && Math.max(...tops) - Math.min(...tops) > 4) {
      return { ok: false, reason: 'search row controls on multiple lines' };
    }
    return { ok: true };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function captureFilesystemProjekt(width, filename, options = {}) {
  const { theme = 'light' } = options;
  await setTheme(theme);
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
  });
  await page.setViewportSize({ width, height: 900 });
  await openProjektMappeView();
  await assertFilesystemContentPaneWidth(`${filename}@${width}`);
  await assertBulkSelectionHintLines(`${filename}@${width}`);
  if (width === 1024 || width === 1280) {
    await assertLibraryToolbarLayout(`${filename}@${width}`, { expectViewControls: true });
    await assertFilesystemContentHeaderActions(`${filename}@${width}`);
  }
  if (width >= 1280) {
    await assertFilesystemCardFill(`${filename}@${width}`);
  }
  if (width === 1440) {
    await assertNoLegacyEhwMappe(`${filename}@${width}`);
    await assertProjektHausTreeCount(`${filename}@${width}`, 3);
  }
  await assertLibraryTableLayout(`${filename}@${width}`, { requireLabelsColumn: false });
  await assertLabelsVisibleOrFallback(`${filename}@${width}`);
  await assertSeedLabelChipsNotTruncated(`${filename}@${width}`);
  await shotAppMain(filename, width);
}

async function assertAuthenticatedView(label) {
  if (page.url().includes('/login')) {
    throw new Error(`${label}: redirected to login — session cookie missing?`);
  }
  const authHeading = page.locator('.auth-layout .auth-card h1');
  if (await authHeading.count()) {
    const text = await authHeading.first().textContent();
    if (text?.trim() === 'Docuvate') {
      throw new Error(`${label}: showing login card instead of app view`);
    }
  }
}

async function assertLibraryTableLayout(label, options = {}) {
  const { requireLabelsColumn = false } = options;
  const metrics = await page.evaluate(() => {
    const card = document.querySelector('.library-doc-table-card, .library-main-card-filesystem');
    const wrap = document.querySelector('.library-table-wrap');
    const table = document.querySelector('.library-table');
    const titleCell = document.querySelector('.library-table td.library-col-title');
    const labelsHeader = document.querySelector('.library-table th.library-col-labels');
    if (!card || !wrap || !table || !titleCell) {
      return null;
    }
    const labelsStyle = labelsHeader ? getComputedStyle(labelsHeader) : null;
    const labelsVisible =
      labelsHeader != null &&
      labelsStyle?.display !== 'none' &&
      labelsStyle?.visibility !== 'hidden' &&
      labelsHeader.getBoundingClientRect().width > 4;
    const actionTh = document.querySelector('.library-table th.library-col-action');
    const actionThRect = actionTh?.getBoundingClientRect();
    const actionHeaderText = actionTh?.textContent?.trim() ?? '';
    const actionHeaderClipped =
      actionTh instanceof HTMLElement && actionTh.scrollWidth > actionTh.clientWidth + 1;
    const actionCell = document.querySelector('.library-table td.library-col-action');
    const actionCellRect = actionCell?.getBoundingClientRect();
    return {
      scrollWidth: table.scrollWidth,
      wrapWidth: wrap.clientWidth,
      cardWidth: card.clientWidth,
      titleWidth: titleCell.clientWidth,
      labelsVisible,
      labelsWidth: labelsHeader?.getBoundingClientRect().width ?? 0,
      actionHeaderText,
      actionHeaderClipped,
      actionThWidth: actionThRect?.width ?? 0,
      actionCellWidth: actionCellRect?.width ?? 0,
      actionThRight: actionThRect?.right ?? 0,
      wrapRight: wrap.getBoundingClientRect().right,
    };
  });
  if (!metrics) {
    throw new Error(`library table/card missing (${label})`);
  }
  if (metrics.scrollWidth > metrics.wrapWidth) {
    throw new Error(
      `${label}: table scrollWidth ${metrics.scrollWidth} > wrap ${metrics.wrapWidth}`
    );
  }
  if (metrics.actionThWidth < 4 || metrics.actionCellWidth < 4) {
    throw new Error(`${label}: action column not visible`);
  }
  if (metrics.actionThRight > metrics.wrapRight + 1) {
    throw new Error(
      `${label}: action header clipped (right ${metrics.actionThRight} > wrap ${metrics.wrapRight})`
    );
  }
  if (metrics.actionHeaderClipped) {
    throw new Error(`${label}: action header text clipped (${metrics.actionHeaderText})`);
  }
  const actionBtn = await page.locator('.library-table td.library-col-action .btn').first();
  if (await actionBtn.count()) {
    const btnClipped = await actionBtn.evaluate((node) => {
      if (!(node instanceof HTMLElement)) return false;
      return node.scrollWidth > node.clientWidth + 1;
    });
    if (btnClipped) {
      throw new Error(`${label}: action button label clipped`);
    }
  }
  if (metrics.titleWidth < 240) {
    throw new Error(`${label}: title column ${metrics.titleWidth}px < 240px`);
  }
  if (requireLabelsColumn && !metrics.labelsVisible) {
    throw new Error(`${label}: labels column must be visible`);
  }
}

async function assertFilesystemCardFill(label) {
  const result = await page.evaluate(() => {
    const body = document.querySelector('.dateisystem-content-body');
    const card = document.querySelector('.library-doc-table-card, .library-main-card-filesystem');
    if (!body || !card) {
      return { ok: false, reason: 'missing content body or card' };
    }
    const ratio = card.clientWidth / body.clientWidth;
    return {
      ok: ratio >= 0.9,
      reason: `card/body ${(ratio * 100).toFixed(1)}% (${card.clientWidth}/${body.clientWidth}px)`,
    };
  });
  if (!result.ok) {
    throw new Error(`${label}: filesystem card must fill ≥90% of content column — ${result.reason}`);
  }
}

async function assertLabelsVisibleOrFallback(label) {
  const result = await page.evaluate(() => {
    const th = document.querySelector('.library-table th.library-col-labels');
    const colVisible =
      th != null &&
      getComputedStyle(th).display !== 'none' &&
      th.getBoundingClientRect().width > 0;
    const fallbackChip = document.querySelector(
      '.library-title-labels-fallback .document-labels-cell .chip-label'
    );
    if (colVisible) return { ok: true };
    if (fallbackChip) return { ok: true };
    return { ok: false, reason: 'labels column hidden and no title fallback chips' };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertSeedLabelChipsNotTruncated(label) {
  const result = await page.evaluate(() => {
    const expected = ['Vertrag', 'Lieferant'];
    for (const name of expected) {
      const labelEl = [
        ...document.querySelectorAll(
          '.library-table .document-labels-cell .chip-label, .library-title-labels-fallback .chip-label'
        ),
      ].find((node) => node.textContent?.trim() === name);
      if (!labelEl) {
        return { ok: false, reason: `chip "${name}" not found` };
      }
      if (labelEl.scrollWidth > labelEl.clientWidth + 1) {
        return {
          ok: false,
          reason: `"${name}" truncated (${labelEl.scrollWidth} > ${labelEl.clientWidth})`,
        };
      }
    }
    return { ok: true };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function setLibraryFiltersOpen(open) {
  await page.evaluate((wantOpen) => {
    const layout = document.querySelector('.library-layout');
    const toggle = document.querySelector('.library-filter-toggle');
    if (!layout) return;
    const isOpen = layout.classList.contains('library-layout--filters-open');
    if (wantOpen === isOpen) return;
    if (toggle instanceof HTMLElement) {
      toggle.click();
      return;
    }
    if (wantOpen) {
      layout.classList.add('library-layout--filters-open');
    } else {
      layout.classList.remove('library-layout--filters-open');
    }
  }, open);
  await page.waitForTimeout(350);
}

async function assertLibraryFilterDrawer(label) {
  const result = await page.evaluate(() => {
    const drawer = document.querySelector('.library-filter-drawer');
    const inlinePanel = document.querySelector('.library-layout > .filter-panel');
    const table = document.querySelector('.library-table');
    if (!drawer || !table) {
      return { ok: false, reason: 'missing drawer or table' };
    }
    const drawerRect = drawer.getBoundingClientRect();
    const toolbar = document.querySelector('.library-list-toolbar');
    const card = document.querySelector('.library-doc-table-card');
    if (drawerRect.width < 240) {
      return { ok: false, reason: `drawer ${Math.round(drawerRect.width)}px wide` };
    }
    if (inlinePanel instanceof HTMLElement && inlinePanel.offsetParent != null) {
      return { ok: false, reason: 'inline filter panel still visible in layout' };
    }
    if (toolbar && card) {
      const gap = card.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom;
      if (gap > 96) {
        return { ok: false, reason: `table card ${Math.round(gap)}px below toolbar (inline filter gap?)` };
      }
    }
    if (!table.getBoundingClientRect().width) {
      return { ok: false, reason: 'table has no width' };
    }
    return { ok: true };
  });
  if (!result.ok) {
    throw new Error(`${label}: filter drawer — ${result.reason}`);
  }
}

async function assertLibraryColumnPriority(label) {
  const result = await page.evaluate(({ hideFolderMax, hideStatusMax }) => {
    const wrap = document.querySelector('.library-table-wrap');
    const folderTh = document.querySelector('.library-table th.library-col-meta');
    const statusTh = document.querySelector('.library-table th.library-col-status');
    if (!wrap || !statusTh) {
      return { ok: false, reason: 'missing table wrap or status header' };
    }
    const containerWidth = wrap.clientWidth;
    const folderVisible =
      folderTh != null &&
      getComputedStyle(folderTh).display !== 'none' &&
      folderTh.getBoundingClientRect().width > 4;
    const statusVisible =
      getComputedStyle(statusTh).display !== 'none' && statusTh.getBoundingClientRect().width > 4;
    const expectFolder = containerWidth > hideFolderMax;
    const expectStatus = containerWidth > hideStatusMax;
    if (folderVisible !== expectFolder) {
      return {
        ok: false,
        reason: `folder column visible=${folderVisible} expected=${expectFolder} (container ${containerWidth}px)`,
      };
    }
    if (statusVisible !== expectStatus) {
      return {
        ok: false,
        reason: `status column visible=${statusVisible} expected=${expectStatus} (container ${containerWidth}px)`,
      };
    }
    return { ok: true };
  }, {
    hideFolderMax: HIDE_FOLDER_MAX,
    hideStatusMax: HIDE_STATUS_MAX,
  });
  if (!result.ok) {
    throw new Error(`${label}: column priority — ${result.reason}`);
  }
}

async function assertNoLegacyEhwMappe(label) {
  const result = await page.evaluate(() => {
    const names = [...document.querySelectorAll('a.sidebar-mappe-link, a.dateisystem-tree-link')]
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean);
    const bad = names.filter((name) => name.includes('EHW'));
    if (bad.length === 0) return { ok: true };
    return { ok: false, reason: `unexpected mappe still in tree: ${bad.join(', ')}` };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertNoRedundantHausFolderLine(label) {
  const result = await page.evaluate(() => {
    const lines = [...document.querySelectorAll('.library-title-folder-fallback')].map((node) =>
      node.textContent?.trim()
    );
    const hausLines = lines.filter((text) => text === 'Haus');
    if (hausLines.length === 0) return { ok: true };
    return { ok: false, reason: `redundant "Haus" under title (${hausLines.length} rows)` };
  });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertProjektHausTreeCount(label, expected) {
  const result = await page.evaluate(({ folderName, expected }) => {
    const rows = [...document.querySelectorAll('.dateisystem-tree-row')];
    const row = rows.find((node) => {
      const link = node.querySelector('a.dateisystem-tree-link');
      return link?.textContent?.trim() === folderName;
    });
    if (!row) {
      return { ok: false, reason: `no tree row for folder "${folderName}"` };
    }
    const countEl = row.querySelector('.dateisystem-tree-count');
    const count = Number.parseInt(countEl?.textContent?.trim() ?? '', 10);
    if (count !== expected) {
      return { ok: false, reason: `"${folderName}" count ${count} expected ${expected}` };
    }
    return { ok: true };
  }, { folderName: 'Haus', expected });
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertSeedFolderNameVisible(label) {
  const result = await page.evaluate((folderName) => {
    const cell = [...document.querySelectorAll('.library-table td.library-col-meta')].find(
      (td) => td.textContent?.trim() === folderName
    );
    if (!cell) {
      return { ok: false, reason: `no folder cell with "${folderName}"` };
    }
    if (cell.scrollWidth > cell.clientWidth + 1) {
      return {
        ok: false,
        reason: `"${folderName}" truncated (${cell.scrollWidth} > ${cell.clientWidth})`,
      };
    }
    return { ok: true };
  }, LIBRARY_SEED_FOLDER);
  if (!result.ok) {
    throw new Error(`${label}: ${result.reason}`);
  }
}

async function assertFilesystemContentHeaderActions(label) {
  const result = await page.evaluate(() => {
    const actions = document.querySelector('.dateisystem-content-actions');
    if (!actions) {
      return { ok: false, reason: 'missing .dateisystem-content-actions' };
    }
    const buttons = [...actions.querySelectorAll('.btn')].filter(
      (node) => node instanceof HTMLElement && node.getBoundingClientRect().height > 0
    );
    if (buttons.length < 2) {
      return { ok: false, reason: 'expected at least two header action buttons' };
    }
    const tops = buttons.map((node) => node.getBoundingClientRect().top);
    if (Math.max(...tops) - Math.min(...tops) > 4) {
      return { ok: false, reason: 'header actions must stay on one row' };
    }
    const pane = document.querySelector('.dateisystem-content-pane');
    const paneWidth = pane?.clientWidth ?? 0;
    if (paneWidth > 0 && paneWidth < 720) {
      const justify = getComputedStyle(actions).justifyContent;
      if (justify === 'flex-end' || justify === 'end' || justify === 'right') {
        return { ok: false, reason: 'narrow pane: actions should be left-aligned' };
      }
    }
    return { ok: true };
  });
  if (!result.ok) {
    throw new Error(`${label}: filesystem header — ${result.reason}`);
  }
}

async function assertLibraryFilterToggleVisible(label) {
  const toggle = page.locator('.library-filter-toggle');
  if ((await toggle.count()) === 0 || !(await toggle.isVisible())) {
    throw new Error(`${label}: filter toggle must be visible in search row`);
  }
}

async function captureLibrary(width, filename, options = {}) {
  const { theme = 'light', filtersOpen = null, requireLabelsColumn = false } = options;
  await setTheme(theme);
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
  });
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.library-doc-table-card .library-table', { timeout: 20000 });
  if (filtersOpen != null) {
    await setLibraryFiltersOpen(filtersOpen);
  }
  await assertLibraryFilterToggleVisible(`${filename}@${width}`);
  if (width >= 1024) {
    await assertLibrarySearchRowOneLine(`${filename}@${width}`);
  }
  if (width < 1280 && filtersOpen) {
    await assertLibraryFilterDrawer(`${filename}@${width}`);
  }
  if (width >= 1280 && filtersOpen !== false) {
    const panelVisible = await page.locator('.library-layout > .filter-panel').isVisible();
    if (!panelVisible) {
      throw new Error(`${filename}@${width}: sidebar filter panel should be visible`);
    }
  }
  if (width === 1024 || width === 1280) {
    await assertLibraryToolbarLayout(`${filename}@${width}`, { expectViewControls: false });
    await assertLibraryColumnPriority(`${filename}@${width}`);
  }
  if (width === 1440 && filtersOpen !== false) {
    await assertSeedFolderNameVisible(`${filename}@${width}`);
  }
  const requireLabels = requireLabelsColumn || (width >= 1280 && filtersOpen !== false);
  await assertLibraryTableLayout(`${filename}@${width}`, {
    requireLabelsColumn: requireLabels,
  });
  if (requireLabels && (width === 1440 || width === 1280)) {
    await assertSeedLabelChipsNotTruncated(`${filename}@${width}`);
  }
  await shotAppMain(filename, width);
}

async function viewportHeightForAppMain() {
  return page.evaluate(() => {
    const main = document.querySelector('.app-main');
    const topbar = document.querySelector('.app-topbar');
    const mainScroll = main?.scrollHeight ?? 900;
    const topbarHeight = topbar?.getBoundingClientRect().height ?? 0;
    return Math.min(Math.max(Math.ceil(topbarHeight + mainScroll), 600), 5000);
  });
}

async function shotAppMain(name, width) {
  const height = await viewportHeightForAppMain();
  await shot(name, width, height);
}

async function shot(name, width, height = 900) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
  const file = path.join(OUT, name);
  if (!name.includes('404') && !name.includes('reset-invalid')) {
    await assertAuthenticatedView(name);
  }
  await page.screenshot({ path: file, fullPage: false });
  console.log('wrote', file);
}

async function setLocale(lang) {
  const localeTag = lang === 'en' ? 'en-US' : 'de-DE';
  await relaunchBrowserLocale(localeTag);
  const hasSession = (await context.cookies()).some((c) => c.name.includes('session'));
  if (sessionReady && !hasSession) {
    await apiLogin();
  }
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((lng) => {
    localStorage.setItem('docuvate.locale', lng);
  }, lang);
  await page.reload({ waitUntil: 'networkidle' });
}

async function setTheme(theme) {
  await page.evaluate((t) => {
    localStorage.setItem('docuvate-theme', t);
    document.documentElement.setAttribute('data-docuvate-theme', t);
  }, theme);
  await page.waitForTimeout(200);
}

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
const buildSha = await page.evaluate(() => window.__DOCUVATE_BUILD_SHA__ ?? 'unknown');
console.log('__DOCUVATE_BUILD_SHA__', buildSha);

await setLocale('de');
await setTheme('light');

await page.goto(`${BASE}/reset-password?token=invalid-token-test`, { waitUntil: 'networkidle' });
await page.waitForSelector('[role="alert"]', { timeout: 20000 });
await shot('de-light-reset-invalid-token-1440.png', 1440);

await page.goto(`${BASE}/nicht-vorhanden-404`, { waitUntil: 'networkidle' });
await shot('de-light-404-1440.png', 1440);

await setLocale('en');
await page.goto(`${BASE}/nicht-vorhanden-404`, { waitUntil: 'networkidle' });
await shot('en-light-404-1440.png', 1440);
await page.goto(`${BASE}/reset-password?token=invalid-token-test`, { waitUntil: 'networkidle' });
await shot('en-light-reset-invalid-token-1440.png', 1440);

await setLocale('de');
await setTheme('light');
await apiLogin();
await seedDocuments();

await page.goto(`${BASE}/settings/connectors`, { waitUntil: 'networkidle' });
await page.waitForSelector('h1', { timeout: 15000 });
await shot('de-light-connectors-1440.png', 1440);

const libraryShots = [
  { locale: 'de', theme: 'light', width: 1440, filtersOpen: true, suffix: 'filters-open' },
  { locale: 'de', theme: 'light', width: 1440, filtersOpen: false, suffix: 'filters-closed' },
  { locale: 'de', theme: 'light', width: 1280, filtersOpen: true },
  { locale: 'de', theme: 'light', width: 1024, filtersOpen: false, suffix: 'filters-closed' },
  { locale: 'de', theme: 'light', width: 1024, filtersOpen: true, suffix: 'filters-open' },
  { locale: 'en', theme: 'dark', width: 1440, filtersOpen: true, suffix: 'filters-open' },
  { locale: 'en', theme: 'dark', width: 1280, filtersOpen: true, suffix: 'filters-open' },
];

for (const shotSpec of libraryShots) {
  await setLocale(shotSpec.locale);
  const suffix = shotSpec.suffix ? `-${shotSpec.suffix}` : '';
  const file = `${shotSpec.locale}-${shotSpec.theme}-library-${shotSpec.width}${suffix}.png`;
  await captureLibrary(shotSpec.width, file, {
    theme: shotSpec.theme,
    filtersOpen: shotSpec.filtersOpen,
  });
}

await setLocale('de');
await setTheme('light');
await ensureProjektMappe();
await captureFilesystemProjekt(1440, 'filesystem-de-light-1440.png');
await captureFilesystemProjekt(1280, 'filesystem-de-light-1280.png');
await captureFilesystemProjekt(1024, 'filesystem-de-light-1024.png');

await setLocale('de');
await setTheme('light');
await page.setViewportSize({ width: 1440, height: 900 });
await openProjektHausFolderView();
await assertNoRedundantHausFolderLine('filesystem-de-light-1440-haus-docs@1440');
await assertFilesystemContentPaneWidth('filesystem-de-light-1440-haus-docs@1440');
await assertBulkSelectionHintLines('filesystem-de-light-1440-haus-docs@1440');
await assertFilesystemCardFill('filesystem-de-light-1440-haus-docs@1440');
await shotAppMain('filesystem-de-light-1440-haus-docs.png', 1440);

await setLocale('de');
await setTheme('light');
await page.setViewportSize({ width: 1024, height: 900 });
await openProjektDirektFolderView();
await assertLibraryToolbarLayout('filesystem-de-light-1024-direkt-empty@1024', {
  expectViewControls: true,
});
await assertFilesystemContentHeaderActions('filesystem-de-light-1024-direkt-empty@1024');
await shotAppMain('filesystem-de-light-1024-direkt-empty.png', 1024);

await setLocale('en');
await setTheme('dark');
await page.setViewportSize({ width: 1024, height: 900 });
await openProjektHausFolderView();
await assertFilesystemContentPaneWidth('filesystem-en-dark-1024@1024');
await shotAppMain('filesystem-en-dark-1024.png', 1024);

async function captureLibraryFilterSidebar(locale, filename) {
  await setLocale(locale);
  await setTheme('light');
  await page.evaluate(() => {
    localStorage.setItem('docuvate.library.viewMode', 'klassisch');
    localStorage.setItem('docuvate.library.filterMode', 'ui');
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.filter-panel .filter-mode-switch', { timeout: 20000 });
  const panelVisible = await page.locator('.library-layout .filter-panel').isVisible();
  if (!panelVisible) {
    throw new Error(`${filename}: filter panel not visible at 1440`);
  }
  await page.locator('.filter-mode-btn').first().click();
  await page.waitForTimeout(250);
  await shot(filename, 1440);
}

await captureLibraryFilterSidebar('de', 'de-light-library-1440-filter-panel.png');
await captureLibraryFilterSidebar('en', 'en-light-library-1440-filter-panel.png');

await setLocale('de');
await setTheme('light');

async function scrollPageTop() {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('.app-main');
    if (main instanceof HTMLElement) {
      main.scrollTop = 0;
    }
  });
  await page.waitForTimeout(250);
}

/** Viewport tops at scrollY=0 — proves SaveBar overlay does not push content. */
async function recognizedFieldsLayoutAnchors() {
  return page.evaluate(() => {
    if (Math.abs(window.scrollY) > 0.5) {
      return { error: `expected scrollY=0, got ${window.scrollY}` };
    }
    const title = document.querySelector('.recognized-fields-page h1');
    const card = document.querySelector('.recognized-fields-catalog-card');
    if (!(title instanceof HTMLElement) || !(card instanceof HTMLElement)) {
      return { error: 'recognized-fields title or catalog card missing' };
    }
    return {
      titleTop: title.getBoundingClientRect().top,
      catalogTop: card.getBoundingClientRect().top,
    };
  });
}

async function assertRecognizedFieldsLayoutStable(pristine, dirty) {
  if (pristine.error) throw new Error(pristine.error);
  if (dirty.error) throw new Error(dirty.error);
  for (const [label, a, b] of [
    ['page title', pristine.titleTop, dirty.titleTop],
    ['catalog card', pristine.catalogTop, dirty.catalogTop],
  ]) {
    const delta = Math.abs(a - b);
    if (delta > 1) {
      throw new Error(
        `recognized-fields layout shift (${label}): pristine top=${a}, dirty top=${b}, delta=${delta}px`
      );
    }
  }
  console.log('recognized-fields layout stable (title + catalog ≤1px at scrollY=0)');
}

async function assertConfidenceSliderLabelsNoOverlap(viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.waitForTimeout(150);
  const overlap = await page.evaluate(() => {
    function rectsOverlap(a, b, tol = 1) {
      return (
        a.left < b.right - tol &&
        a.right > b.left + tol &&
        a.top < b.bottom - tol &&
        a.bottom > b.top + tol
      );
    }
    const nodes = document.querySelectorAll(
      '.confidence-threshold-slider__tick, .confidence-threshold-slider__legend-row'
    );
    const rects = [];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.width >= 1 && rect.height >= 1) rects.push(rect);
    }
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        if (rectsOverlap(rects[i], rects[j], 1)) {
          return { i, j };
        }
      }
    }
    return null;
  });
  if (overlap) {
    throw new Error(
      `confidence slider label overlap at ${viewportWidth}px (labels ${overlap.i} vs ${overlap.j})`
    );
  }
  console.log('confidence slider labels OK at', viewportWidth);
}

await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
await page.waitForSelector('.recognized-fields-page', { timeout: 15000 });
await scrollPageTop();
const pristineLayout1440 = await recognizedFieldsLayoutAnchors();
await shot('de-light-recognized-fields-pristine-1440.png', 1440);

const confidenceSlider = page.locator('.recognized-fields-defaults-card .confidence-threshold-slider').first();
await confidenceSlider.waitFor({ timeout: 15000 });
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(150);
{
  const closeupContext = await browser.newContext({
    locale: browserLocale,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: await context.storageState(),
  });
  const closeupPage = await closeupContext.newPage();
  await closeupPage.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
  const closeupSlider = closeupPage.locator(
    '.recognized-fields-defaults-card .confidence-threshold-slider'
  );
  await closeupSlider.waitFor({ state: 'visible', timeout: 15000 });
  await closeupSlider.screenshot({
    path: path.join(OUT, 'de-light-confidence-segmented-bar-closeup.png'),
  });
  await closeupContext.close();
}
console.log('wrote', path.join(OUT, 'de-light-confidence-segmented-bar-closeup.png'));
for (const w of [1440, 1024, 390]) {
  await assertConfidenceSliderLabelsNoOverlap(w);
}
await page.setViewportSize({ width: 1440, height: 900 });
await scrollPageTop();

const defaultsSlider = page.locator('.recognized-fields-defaults-card input[type="range"]').first();
await defaultsSlider.waitFor({ timeout: 15000 });
async function nudgeDefaultsSlider(target = '0.85') {
  const current = await defaultsSlider.inputValue();
  const next =
    Math.abs(Number(current) - Number(target)) < 0.01
      ? Number(current) >= 0.8
        ? '0.58'
        : '0.85'
      : target;
  await defaultsSlider.fill(next);
}
await nudgeDefaultsSlider('0.85');
await page.waitForSelector('.save-bar', { timeout: 10000 });
if (await page.locator('.recognized-fields-header-actions').count()) {
  throw new Error('recognized-fields-header-actions must not appear (use SaveBar overlay)');
}
await scrollPageTop();
const dirtyLayout1440 = await recognizedFieldsLayoutAnchors();
await assertRecognizedFieldsLayoutStable(pristineLayout1440, dirtyLayout1440);
await shot('de-light-recognized-fields-dirty-savebar-1440.png', 1440);
await shot('de-light-recognized-fields-pristine-390.png', 390, 1200);
await page.setViewportSize({ width: 1440, height: 900 });
await scrollPageTop();
await page.setViewportSize({ width: 1024, height: 900 });
await page.waitForTimeout(150);
await scrollPageTop();
await shot('de-light-recognized-fields-dirty-savebar-1024.png', 1024);
await page.setViewportSize({ width: 1440, height: 900 });
await shot('de-light-recognized-fields-dirty-savebar-390.png', 390, 1200);
const saveBarSave = page.locator('.save-bar button.btn-primary');
await saveBarSave.click();
await page.waitForSelector('.toast--success', { timeout: 15000 });
await shot('de-light-recognized-fields-toast-saved-1440.png', 1440);

await defaultsSlider.waitFor({ timeout: 15000 });
await nudgeDefaultsSlider('0.58');
await page.waitForSelector('.save-bar', { timeout: 10000 });
await page.locator('.sidebar-link[href="/documents"], a.sidebar-link[href="/documents"]').first().click();
const unsavedLeaveDialog = page.getByRole('dialog', { name: 'Seite verlassen?' });
await unsavedLeaveDialog.waitFor({ state: 'visible', timeout: 10000 });
await shot('de-light-recognized-fields-unsaved-dialog-1440.png', 1440);
await unsavedLeaveDialog.getByRole('button', { name: 'Bleiben' }).click();
await page.waitForSelector('.recognized-fields-page', { timeout: 15000 });

await setLocale('de');
await setTheme('dark');
await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
await page.waitForSelector('.recognized-fields-page', { timeout: 15000 });
await shot('de-dark-recognized-fields-pristine-1440.png', 1440);
await shot('de-dark-recognized-fields-pristine-390.png', 390, 1200);
await nudgeDefaultsSlider('0.72');
await page.waitForSelector('.save-bar', { timeout: 10000 });
await scrollPageTop();
await shot('de-dark-recognized-fields-dirty-savebar-1440.png', 1440);
const darkSaveBarSave = page.locator('.save-bar button.btn-primary');
await darkSaveBarSave.click();
await page.waitForSelector('.toast--success', { timeout: 15000 });
await shot('de-dark-recognized-fields-toast-saved-1440.png', 1440);

await setLocale('en');
await setTheme('dark');
await page.goto(`${BASE}/structure/recognized-fields`, { waitUntil: 'networkidle' });
await page.waitForSelector('.recognized-fields-page', { timeout: 15000 });
await shot('en-dark-recognized-fields-pristine-1440.png', 1440);

await setLocale('de');
await setTheme('light');
await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
const firstDoc = page.locator('a.library-title-link').first();
await firstDoc.waitFor({ timeout: 15000 });
await firstDoc.click();
await page.waitForURL(/\/documents\//, { timeout: 15000 });
await setTheme('light');
await shot('de-light-doc-details-1440.png', 1440);

const chatTab = page.getByRole('tab', { name: /Chat/i });
if (await chatTab.count()) {
  await setTheme('dark');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /Chat/i }).click();
  await page.waitForSelector('.doc-chat', { timeout: 15000 });
  const themeAttr = await page.evaluate(() =>
    document.documentElement.getAttribute('data-docuvate-theme')
  );
  if (themeAttr !== 'dark') {
    throw new Error(`expected dark theme before chat screenshot, got ${themeAttr}`);
  }
  await page.waitForTimeout(600);
  await shot('de-dark-doc-chat-1440.png', 1440);
}

await setTheme('light');
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
await page.waitForSelector('.settings-grid', { timeout: 15000 });
await shot('de-light-settings-1440.png', 1440);

await page.goto(`${BASE}/documents`, { waitUntil: 'networkidle' });
const docForMeta = page.locator('a.library-title-link').first();
await docForMeta.waitFor({ timeout: 15000 });
await docForMeta.click();
await page.waitForURL(/\/documents\//, { timeout: 15000 });
await page.getByRole('tab', { name: /Details/i }).click();
await page.locator('label').filter({ hasText: /Titel|Title/i }).locator('input').first().fill('Screenshot Titel geändert');
await page.waitForSelector('.save-bar', { timeout: 10000 });
await shot('de-light-document-metadata-savebar-1440.png', 1440);
await page.evaluate(() => {
  for (const body of document.querySelectorAll('.extracted-text-body')) {
    if (body instanceof HTMLElement) {
      body.scrollTop = 0;
    }
  }
  const main = document.querySelector('.app-main');
  if (main instanceof HTMLElement) {
    main.scrollTop = main.scrollHeight;
  }
});
await page.waitForTimeout(200);
async function assertDocumentDetailSaveBarClearance() {
  const result = await page.evaluate(() => {
    const saveInner = document.querySelector('.save-bar-inner');
    if (!(saveInner instanceof HTMLElement)) {
      return { ok: false, reason: 'save bar not visible' };
    }
    const barTop = saveInner.getBoundingClientRect().top;
    const cards = document.querySelectorAll(
      '.detail-workspace .preview-card, .detail-workspace .extraction-panel-side'
    );
    if (cards.length === 0) {
      return { ok: false, reason: 'detail workspace cards missing' };
    }
    let maxBottom = 0;
    for (const card of cards) {
      if (card instanceof HTMLElement) {
        maxBottom = Math.max(maxBottom, card.getBoundingClientRect().bottom);
      }
    }
    const gap = barTop - maxBottom;
    return { ok: gap >= 8, gap, barTop, maxBottom };
  });
  if (!result.ok) {
    throw new Error(
      `document detail save bar clearance failed: ${result.reason ?? `gap=${result.gap}px (need ≥8)`}`
    );
  }
  console.log('document detail save bar clearance OK', result.gap);
}
await assertDocumentDetailSaveBarClearance();
await shot('de-light-document-detail-bottom-savebar-1440.png', 1440);

for (const entry of await readdir(OUT)) {
  if (entry.endsWith('.png')) {
    await copyFile(path.join(OUT, entry), path.join(STORE_OUT, entry));
  }
}

const pr80Files = [
  'de-light-library-1024-filters-closed.png',
  'de-light-library-1280.png',
  'de-light-library-1440-filters-open.png',
  'filesystem-de-light-1440-haus-docs.png',
  'filesystem-de-light-1440.png',
  'filesystem-de-light-1024.png',
  'filesystem-en-dark-1024.png',
  'en-dark-library-1440-filters-open.png',
  'en-dark-library-1280-filters-open.png',
];
for (const name of pr80Files) {
  const src = path.join(OUT, name);
  try {
    await copyFile(src, path.join(PR80_SHOTS, name));
  } catch {
    console.warn('pr80 shot missing', name);
  }
}

await browser.close();
console.log('done', { buildSha });
