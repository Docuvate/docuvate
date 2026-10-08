import { expect, test } from '@playwright/test';
import path from 'node:path';
import { execSync } from 'node:child_process';

const widths = [390, 768, 1024, 1280, 1440] as const;
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const authOrigin = process.env['E2E_AUTH_ORIGIN'] ?? 'http://localhost:5173';
const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const seedEmail =
  process.env['SEED_EMAIL'] ?? process.env['E2E_SMOKE_EMAIL'] ?? 'ordner.demo@fixture.docuvate.test';
const seedPassword =
  process.env['E2E_SMOKE_PASSWORD'] ?? process.env['SEED_PASSWORD'] ?? 'screenshot-demo-12';
const workspaceRoot = path.join(process.cwd(), '..');

function runSeed() {
  return JSON.parse(
    execSync('node tools/screenshots/ordnerbaum/seed.mjs', {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        WEB_ORIGIN: authOrigin,
        API_BASE: `${apiBase}/v1`,
        AUTH_BASE: `${apiBase}/api/auth`,
        DATABASE_URL:
          process.env['DATABASE_URL'] ??
          'postgresql://docuvate:docuvate@localhost:5433/docuvate',
        SEED_EMAIL: seedEmail,
        SEED_PASSWORD: seedPassword,
      },
    }).toString()
  ) as { authCookie: string; direktFolderId: string };
}

type Box = { left: number; right: number; top: number; bottom: number; height: number };

function overlaps(a: Box, b: Box, gap = 0): boolean {
  const hSep = a.right + gap <= b.left || b.right + gap <= a.left;
  const vSep = a.bottom <= b.top || b.bottom <= a.top;
  return !(hSep || vSep);
}

function assertRow(boxes: Box[], label: string) {
  const groups = new Map<number, Box[]>();
  for (const box of boxes) {
    const key = Math.round((box.top + box.bottom) / 2 / 12);
    const group = groups.get(key) ?? [];
    group.push(box);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        expect(overlaps(group[i]!, group[j]!, 1), `${label} overlap ${i}/${j}`).toBe(false);
      }
    }
    if (group.length > 1) {
      const heights = group.map((b) => b.height);
      expect(Math.max(...heights) - Math.min(...heights), `${label} height`).toBeLessThanOrEqual(3);
    }
  }
}

test.describe('Filesystem document toolbar geometry', () => {
  let seed: { authCookie: string; direktFolderId: string };

  test.beforeAll(() => {
    seed = runSeed();
  });

  for (const width of widths) {
    test(`no control overlap at ${width}px`, async ({ page }) => {

      await page.setViewportSize({ width, height: 900 });
      await page.context().addCookies([
        {
          name: 'better-auth.session_token',
          value: decodeURIComponent(seed.authCookie),
          domain: new URL(webOrigin).hostname,
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      await page.addInitScript(() => {
        window.localStorage.setItem('i18nextLng', 'de');
        window.localStorage.setItem('docuvate-theme', 'light');
      });
      await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.locator('.library-list-toolbar-filesystem').waitFor({ state: 'visible', timeout: 45_000 });

      const rows = await page.evaluate(() => {
        function boxesFromRow(row: Element | null) {
          if (!row) {
            return [] as Array<{
              left: number;
              right: number;
              top: number;
              bottom: number;
              height: number;
            }>;
          }
          const selectors = [
            '.library-list-search input',
            '.library-list-search .btn-secondary',
            '.library-view-switcher-segmented',
            '.custom-select-trigger',
          ].join(', ');
          return [...row.querySelectorAll(selectors)].map((el) => {
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              height: r.height,
            };
          });
        }
        const toolbar = document.querySelector('.library-list-toolbar-filesystem');
        if (!toolbar) {
          return { ok: false as const, reason: 'missing toolbar' };
        }
        return {
          ok: true as const,
          search: boxesFromRow(toolbar.querySelector('.library-list-search')),
          controls: boxesFromRow(toolbar.querySelector('.library-list-toolbar-controls')),
        };
      });

      expect(rows.ok, 'toolbar rows').toBe(true);
      if (!rows.ok) {
        return;
      }

      assertRow(rows.search, `search row @ ${width}px`);
      assertRow(rows.controls, `controls row @ ${width}px`);
    });
  }

  test('tree does not overlap content header at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'de');
      window.localStorage.setItem('docuvate-theme', 'light');
    });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: decodeURIComponent(seed.authCookie),
        domain: new URL(webOrigin).hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.dateisystem-shell').waitFor({ state: 'visible', timeout: 45_000 });
    await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    const layout = await page.evaluate(() => {
      const header = document.querySelector('.dateisystem-content-header');
      const tree =
        document.querySelector('.dateisystem-sidebar .dateisystem-tree-nav') ??
        document.querySelector('.dateisystem-sidebar .dateisystem-tree');
      const sidebar = document.querySelector('.dateisystem-sidebar');
      if (!header || !tree || !sidebar) {
        return { ok: false as const, reason: 'missing nodes' };
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
      return { ok: !intersects && stackedOk, treeBottom: tr.bottom, headerTop: hr.top };
    });
    expect(layout.ok, JSON.stringify(layout)).toBe(true);
  });

  test('compact content header at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'de');
      window.localStorage.setItem('docuvate-theme', 'light');
    });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: decodeURIComponent(seed.authCookie),
        domain: new URL(webOrigin).hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.dateisystem-content-header').waitFor({ state: 'visible', timeout: 45_000 });
    await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    const headerMetrics = await page.evaluate(() => {
      const title = document.querySelector('.dateisystem-page-title');
      const actionsRow = document.querySelector('.dateisystem-content-actions-row');
      const header = document.querySelector('.dateisystem-content-header');
      if (!title || !actionsRow || !header) {
        return { ok: false as const, reason: 'missing nodes' };
      }
      const tr = title.getBoundingClientRect();
      const ar = actionsRow.getBoundingClientRect();
      const hr = header.getBoundingClientRect();
      const gap = ar.top - tr.bottom;
      return { ok: true as const, gap, headerHeight: hr.height };
    });
    expect(headerMetrics.ok, 'header nodes').toBe(true);
    if (!headerMetrics.ok) {
      return;
    }
    expect(headerMetrics.gap, 'title to actions gap').toBeLessThanOrEqual(12);
    expect(headerMetrics.headerHeight, 'header height').toBeLessThanOrEqual(168);
  });

  for (const width of [1024, 1280] as const) {
    test(`shows Neuer Ordner in header at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        window.localStorage.setItem('i18nextLng', 'de');
      });
      await page.context().addCookies([
        {
          name: 'better-auth.session_token',
          value: decodeURIComponent(seed.authCookie),
          domain: new URL(webOrigin).hostname,
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.locator('.dateisystem-content-header').waitFor({ state: 'visible', timeout: 45_000 });
      await expect(page.locator('[data-dateisystem-new-folder-trigger]')).toBeVisible();
    });
  }

  test('shows Neuer Ordner in header at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'de');
    });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: decodeURIComponent(seed.authCookie),
        domain: new URL(webOrigin).hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.dateisystem-content-header').waitFor({ state: 'visible', timeout: 45_000 });
    await expect(page.locator('[data-dateisystem-new-folder-trigger]')).toBeVisible();
  });

  test('overflow menu opens new folder form at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'de');
    });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: decodeURIComponent(seed.authCookie),
        domain: new URL(webOrigin).hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto(`${webOrigin}/filesystem/folders/${seed.direktFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.dateisystem-content-header').waitFor({ state: 'visible', timeout: 45_000 });
    const overflow = page.getByRole('button', { name: /weitere aktionen|more actions/i });
    await overflow.waitFor({ state: 'visible', timeout: 15_000 });
    await overflow.click();
    await page.getByRole('menuitem', { name: /neuer ordner|new folder/i }).click();
    await expect(page.locator('.dateisystem-toolbar-new-folder input')).toBeVisible();
  });
});
