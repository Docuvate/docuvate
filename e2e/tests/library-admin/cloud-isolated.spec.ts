// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, type Page, test } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const apiBase = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3001';
const shotDir = process.env['CLOUD_AUDIT_SHOT_DIR'] ?? '/opt/cursor/artifacts/library-admin-cloud';
const authFile = '/tmp/docuvate-library-admin-cloud-auth.json';
let leaseTitle = '';
let secondTitle = '';

const ANONYMOUS_PATHS = [
  '/documents',
  '/documents/duplicates',
  '/documents/views',
  '/structure/labels',
  '/structure/recognized-fields',
  '/filesystem',
  '/settings',
  '/settings/connectors',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readId(body: unknown): string {
  if (isRecord(body) && typeof body.id === 'string') return body.id;
  throw new Error('response has no id');
}

async function syntheticPdf(label: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([240, 240]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(label, { x: 24, y: 120, size: 12, font });
  return Buffer.from(await doc.save());
}

function auditEmail(): string {
  const value = process.env['DOCUVATE_AUDIT_EMAIL']?.trim();
  if (!value) throw new Error('DOCUVATE_AUDIT_EMAIL is required');
  return value;
}

function auditPassword(): string {
  const value = process.env['DOCUVATE_AUDIT_PASSWORD'];
  if (!value) throw new Error('DOCUVATE_AUDIT_PASSWORD is required');
  return value;
}

async function shot(page: Page, name: string): Promise<void> {
  await fs.mkdir(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, `${name}.png`), fullPage: true });
}

async function ensureEnglish(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'User menu' }).click();
  await page
    .getByRole('radiogroup', { name: 'Language' })
    .getByRole('radio', { name: 'English' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.keyboard.press('Escape');
}

async function showClassicLibrary(page: Page): Promise<void> {
  await page.goto('/documents');
  await page.getByRole('radio', { name: 'Classic' }).click();
}

interface DocumentListSlice {
  nextCursor: string | null;
  titles: string[];
}

function readDocumentList(body: unknown): DocumentListSlice {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new Error('document list missing');
  }
  const titles: string[] = [];
  for (const item of body.items) {
    if (isRecord(item) && typeof item.title === 'string') {
      titles.push(item.title);
    }
  }
  return {
    nextCursor: typeof body.nextCursor === 'string' ? body.nextCursor : null,
    titles,
  };
}

async function uploadSynthetic(page: Page, filename: string, bytes: Buffer): Promise<void> {
  const uploaded = await page.request.post(`${apiBase}/v1/documents`, {
    multipart: {
      file: { name: filename, mimeType: 'application/pdf', buffer: bytes },
    },
  });
  expect(uploaded.ok(), await uploaded.text()).toBe(true);
}

async function ensureSecondDocumentPage(page: Page): Promise<void> {
  for (let index = 0; index < 60; index += 1) {
    const listed = await page.request.get(`${apiBase}/v1/documents?limit=50`);
    expect(listed.ok(), await listed.text()).toBe(true);
    if (readDocumentList(await listed.json()).nextCursor) {
      return;
    }
    const name = `lib-audit page ${String(index)} ${String(Date.now())}`;
    await uploadSynthetic(page, `${name}.pdf`, await syntheticPdf(name));
  }
  throw new Error('library never reached a second page');
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(auditEmail());
  await page.locator('input[type="password"]').fill(auditPassword());
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test.describe('public routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('LIB-001 login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await shot(page, 'LIB-001-login');
  });

  test('LIB-002 register form is not submitted', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await shot(page, 'LIB-002-register');
  });

  test('LIB-003 forgot-password form is not submitted', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await shot(page, 'LIB-003-forgot-password');
  });

  for (const routePath of ANONYMOUS_PATHS) {
    test(`LIB-004 anonymous ${routePath} returns to login`, async ({ page }) => {
      await page.goto(routePath);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe('synthetic tenant', () => {
  test.describe.configure({ mode: 'serial' });
  let leaseId = '';

  test.beforeAll(async ({ browser }) => {
    const stamp = String(Date.now());
    leaseTitle = `lib-audit lease ${stamp}`;
    secondTitle = `lib-audit notice ${stamp}`;
    const page = await browser.newPage({
      baseURL: process.env['E2E_WEB_URL'] ?? 'http://127.0.0.1:5173',
      locale: 'en-US',
      storageState: { cookies: [], origins: [] },
    });
    await login(page);
    await page.context().storageState({ path: authFile });

    const upload = await page.request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: 'lib-audit-lease.pdf',
          mimeType: 'application/pdf',
          buffer: await syntheticPdf(leaseTitle),
        },
      },
    });
    expect(upload.ok(), await upload.text()).toBe(true);
    leaseId = readId(await upload.json());
    const patched = await page.request.patch(`${apiBase}/v1/documents/${leaseId}`, {
      data: { title: leaseTitle, documentDate: '2026-10-22' },
    });
    expect(patched.ok(), await patched.text()).toBe(true);

    const second = await page.request.post(`${apiBase}/v1/documents`, {
      multipart: {
        file: {
          name: 'lib-audit-notice.pdf',
          mimeType: 'application/pdf',
          buffer: await syntheticPdf(secondTitle),
        },
      },
    });
    expect(second.ok(), await second.text()).toBe(true);
    const secondId = readId(await second.json());
    const renamed = await page.request.patch(`${apiBase}/v1/documents/${secondId}`, {
      data: { title: secondTitle },
    });
    expect(renamed.ok(), await renamed.text()).toBe(true);
    await page.close();
  });

  test.use({ storageState: authFile });

  test('LIB-012 dashboard stays signed in', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    await shot(page, 'LIB-012-dashboard');
  });

  test('LIB-032 language and theme controls', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.getByRole('button', { name: 'User menu' }).click();
    const language = page.getByRole('radiogroup', { name: 'Language' });
    await expect(language).toBeVisible();
    await language.getByRole('radio', { name: 'English' }).click();
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', 'dark');
    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-docuvate-theme', 'light');
    await shot(page, 'LIB-032-settings-theme');
  });

  test('LIB-015 library lists the synthetic lease', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('link', { name: leaseTitle })).toBeVisible();
    await shot(page, 'LIB-015-library-list');
  });

  test('LIB-016 LIB-018 LIB-017 focus date and keyboard', async ({ page }) => {
    await page.goto('/documents');
    await page.getByRole('radio', { name: 'Focus' }).click();
    const lease = page.locator('button[data-library-focus-id]', { hasText: leaseTitle });
    await expect(lease).toBeVisible();
    await expect(lease).toContainText('Oct 22, 2026');
    await lease.focus();
    await page.keyboard.press('ArrowDown');
    const focusedId = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement ? (active.dataset['libraryFocusId'] ?? '') : '';
    });
    const leaseIdOnRow = await lease.getAttribute('data-library-focus-id');
    expect(focusedId).not.toBe('');
    expect(focusedId).not.toBe(leaseIdOnRow);
    await shot(page, 'LIB-017-focus');
  });

  test('LIB-020 search finds only the lease title', async ({ page }) => {
    await page.goto('/documents');
    const search = page.getByRole('textbox', { name: /search documents/i });
    await search.fill(leaseTitle);
    await search.press('Enter');
    await expect(page.getByRole('link', { name: leaseTitle })).toBeVisible();
    await expect(page.getByRole('link', { name: secondTitle })).toHaveCount(0);
    await shot(page, 'LIB-020-search');
  });

  test('LIB-022 sort control changes the library query', async ({ page }) => {
    await page.goto('/documents');
    await page.getByRole('button', { name: 'Sort' }).click();
    await page.getByRole('option', { name: 'Title A-Z' }).click();
    await expect(page).toHaveURL(/sort=title/);
  });

  test('LIB-026 LIB-027 create and delete one synthetic label', async ({ page }) => {
    const name = `Lease packet ${String(Date.now())}`;
    await page.goto('/structure/labels');
    await page.getByRole('button', { name: 'New label' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(name);
    const created = page.waitForResponse(
      (response) => response.url().includes('/v1/tags') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Create label' }).click();
    const createResponse = await created;
    expect(createResponse.ok(), await createResponse.text()).toBe(true);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await shot(page, 'LIB-026-label');
    await page.getByRole('button', { name: `More actions for ${name}` }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('LIB-024 save a view and open it from the dashboard widget', async ({ page }) => {
    const viewName = `lib-audit lease view ${String(Date.now())}`;
    await page.goto('/documents');
    await page.getByRole('button', { name: 'Saved views: save, update, manage' }).click();
    await page.getByRole('menuitem', { name: 'Save view' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/name/i).fill(viewName);
    await dialog.getByRole('button', { name: /save/i }).click();
    await expect(dialog).toBeHidden();

    const listed = await page.request.get(`${apiBase}/v1/saved-views`);
    expect(listed.ok()).toBe(true);
    const body: unknown = await listed.json();
    if (!isRecord(body) || !Array.isArray(body.items)) throw new Error('saved views missing');
    const match = body.items.find(
      (item) => isRecord(item) && item.name === viewName && typeof item.id === 'string'
    );
    if (!isRecord(match) || typeof match.id !== 'string') throw new Error('saved view id missing');

    const layout = await page.request.get(`${apiBase}/v1/dashboard`);
    expect(layout.ok()).toBe(true);
    const layoutBody: unknown = await layout.json();
    const existing =
      isRecord(layoutBody) && Array.isArray(layoutBody.widgets) ? layoutBody.widgets : [];
    const widgets = [
      ...existing.filter((item) => isRecord(item) && item.type !== 'saved_view'),
      {
        type: 'saved_view',
        position: existing.length,
        widthCols: 6,
        heightRows: 2,
        savedViewId: match.id,
      },
    ];
    const replaced = await page.request.put(`${apiBase}/v1/dashboard`, { data: { widgets } });
    expect(replaced.ok(), await replaced.text()).toBe(true);

    await page.goto('/');
    const viewAll = page.locator(`a[href="/documents?view=${match.id}"]`);
    await expect(viewAll).toBeVisible();
    await shot(page, 'LIB-013-saved-view-widget');
    await viewAll.click();
    await expect(page).toHaveURL(new RegExp(`view=${match.id}`));
    await expect(page.getByRole('link', { name: leaseTitle })).toBeVisible();
  });

  test('LIB-028 recognized fields page', async ({ page }) => {
    await page.goto('/structure/recognized-fields');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    await shot(page, 'LIB-028-fields');
  });

  test('LIB-029 create a root folder', async ({ page }) => {
    const name = `lib-audit folder ${String(Date.now())}`;
    await page.goto('/filesystem');
    await page.locator('[data-dateisystem-new-folder-trigger="true"]').click();
    await page.getByRole('textbox', { name: 'Name of new top-level folder' }).fill(name);
    await page
      .locator('form.dateisystem-toolbar-new-folder')
      .getByRole('button', { name: 'Create' })
      .click();
    await expect(page.getByRole('treeitem', { name: new RegExp(name) })).toBeVisible();
    await shot(page, 'LIB-029-filesystem');
  });

  test('LIB-031 duplicates page stays signed in', async ({ page }) => {
    await page.goto('/documents/duplicates');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    await shot(page, 'LIB-031-duplicates');
  });

  test('LIB-037 connectors page does not call import', async ({ page }) => {
    const live: string[] = [];
    page.on('request', (req) => {
      if (/\/import|dry-run|test-connection|\/export/.test(req.url()) && req.method() !== 'GET') {
        live.push(`${req.method()} ${req.url()}`);
      }
    });
    await page.goto('/settings/connectors');
    await expect(page.locator('h1').first()).toBeVisible();
    expect(live).toEqual([]);
    await shot(page, 'LIB-037-connectors');
  });

  test('LIB-026 near-duplicate label uses the active language', async ({ page }) => {
    const token = Math.random().toString(36).slice(2, 10);
    const existing = `Label ${token}`;
    const similar = `Labels ${token}`;
    await page.goto('/structure/labels');
    await page.getByRole('button', { name: 'New label' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(existing);
    await page.getByRole('button', { name: 'Create label' }).click();
    await expect(page.getByText(existing, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New label' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(similar);
    await page.getByRole('button', { name: 'Create label' }).click();
    await expect(page.locator('#app-main-content p[role="alert"]')).toHaveText(
      'Too similar to an existing label. Rename it or use the existing one.'
    );
    await shot(page, 'LIB-026-near-duplicate');
  });

  test('LIB-033 paperless setup keeps English without a remote call', async ({ page }) => {
    const calls: string[] = [];
    page.on('request', (req) => {
      if (/test-connection|dry-run|\/import|paperless/.test(req.url()) && req.method() !== 'GET') {
        calls.push(`${req.method()} ${req.url()}`);
      }
    });
    await page.goto('/settings/connectors/paperless/00000000-0000-4000-8000-000000000001');
    await expect(page.getByText('No Paperless connector is linked to this page.')).toBeVisible();
    await expect(
      page.getByText('Für diese Seite ist kein Paperless-Connector verknüpft.')
    ).toHaveCount(0);
    expect(calls).toEqual([]);
    await shot(page, 'LIB-033-paperless');
  });

  test('LIB-016 cards show the synthetic lease', async ({ page }) => {
    await ensureEnglish(page);
    await page.goto('/documents');
    await page.getByRole('radio', { name: 'Cards' }).click();
    const card = page.locator('.doc-card', { hasText: leaseTitle });
    await expect(card).toBeVisible();
    await expect(card.locator('a.doc-card-link')).toHaveAttribute('href', `/documents/${leaseId}`);
    await shot(page, 'LIB-016-cards');
  });

  test('LIB-021 filter drawer keeps the dated lease and hides the notice', async ({ page }) => {
    await ensureEnglish(page);
    await page.setViewportSize({ width: 1100, height: 800 });
    await showClassicLibrary(page);
    await page.getByRole('button', { name: 'Show filters' }).click();
    const drawer = page.getByRole('dialog', { name: 'Document filters' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Failed' }).click();
    await drawer.getByTestId('library-filter-date-from').fill('2026-10-22');
    await drawer.getByRole('button', { name: 'Hide filters' }).click();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(/status%3Aerror/);
    await expect(page).toHaveURL(/from%3A2026-10-22/);
    await expect(page.getByRole('link', { name: leaseTitle, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: secondTitle, exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('link', { name: leaseTitle, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: secondTitle, exact: true })).toHaveCount(0);
    await shot(page, 'LIB-021-filters');
  });

  test('LIB-035 narrow layout opens the menu and Escape returns focus', async ({ page }) => {
    await ensureEnglish(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/documents');
    const skip = page.locator('.skip-link');
    await skip.focus();
    await expect(skip).toBeVisible();
    await skip.press('Enter');
    await expect(page.locator('#app-main-content')).toBeFocused();
    const menu = page.getByRole('button', { name: 'Main navigation' });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    const drawer = page.getByRole('complementary', { name: 'Main navigation' });
    await expect(drawer.getByRole('link', { name: 'Documents' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
    await shot(page, 'LIB-035-narrow');
  });

  test('LIB-040 file input uploads one synthetic PDF', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureEnglish(page);
    const filename = `lib-audit-ui-${String(Date.now())}.pdf`;
    const filePath = path.join('/tmp', filename);
    await fs.writeFile(filePath, await syntheticPdf(filename));
    await showClassicLibrary(page);
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Upload', exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles(filePath);
    await expect(page.getByRole('link', { name: filename })).toBeVisible({ timeout: 30_000 });
    await shot(page, 'LIB-040-file-input');
  });

  test('LIB-036 export downloads a CSV and the original PDF', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureEnglish(page);
    await showClassicLibrary(page);
    const csvPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export field values' }).click();
    await page.getByRole('menuitem', { name: 'CSV for spreadsheets' }).click();
    const csv = await csvPromise;
    expect(csv.suggestedFilename()).toMatch(/^docuvate-field-values-\d{4}-\d{2}-\d{2}\.csv$/);
    const csvPath = path.join(shotDir, csv.suggestedFilename());
    await csv.saveAs(csvPath);
    const csvText = await fs.readFile(csvPath, 'utf8');
    expect(csvText.startsWith('documentId,title,filename,fieldKey,value,confidence')).toBe(true);

    await page.goto(`/documents/${leaseId}`);
    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Download original' }).click();
    const pdf = await pdfPromise;
    const pdfPath = path.join(shotDir, `LIB-036-${pdf.suggestedFilename()}`);
    await pdf.saveAs(pdfPath);
    const bytes = await fs.readFile(pdfPath);
    expect(bytes.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(100);
    await shot(page, 'LIB-036-export');
  });

  test('LIB-025 pin and unpin a saved view persists', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureEnglish(page);
    const viewName = `lib-audit pin ${String(Date.now())}`;
    await showClassicLibrary(page);
    await page.getByRole('button', { name: 'Saved views: save, update, manage' }).click();
    await page.getByRole('menuitem', { name: 'Save view' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/name/i).fill(viewName);
    await dialog.getByRole('button', { name: /save/i }).click();
    await expect(dialog).toBeHidden();

    await page.goto('/documents/views');
    const row = page.getByRole('row').filter({ hasText: viewName });
    const pin = row.getByRole('switch', { name: 'Pin to navigation' });
    await row.getByText('Pin to navigation', { exact: true }).click();
    await expect(pin).toBeChecked();
    await page.reload();
    await expect(
      page.getByRole('row').filter({ hasText: viewName }).getByRole('switch')
    ).toBeChecked();
    await page.goto('/documents');
    const pinned = page.locator('a.ribbon-saved-view-link', { hasText: viewName });
    await expect(pinned).toBeVisible();
    await pinned.click();
    await expect(page).toHaveURL(/view=/);
    await shot(page, 'LIB-025-pinned');

    await page.goto('/documents/views');
    const unpinRow = page.getByRole('row').filter({ hasText: viewName });
    const unpin = unpinRow.getByRole('switch');
    await unpinRow.getByText('Pin to navigation', { exact: true }).click();
    await expect(unpin).not.toBeChecked();
    await page.reload();
    await expect(
      page.getByRole('row').filter({ hasText: viewName }).getByRole('switch')
    ).not.toBeChecked();
    await page.goto('/documents');
    await expect(page.locator('a.ribbon-saved-view-link', { hasText: viewName })).toHaveCount(0);
  });

  test('LIB-028 edit one recognized field and keep it after reload', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureEnglish(page);
    const created = `Harbor audit ${String(Date.now())}`;
    const renamed = `${created} revised`;
    await page.goto('/structure/recognized-fields');
    await page.getByRole('button', { name: 'Add field' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Name' }).fill(created);
    await dialog.getByRole('radio', { name: 'Always' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('row', { name: created })).toBeVisible();
    await page.getByRole('row', { name: created }).getByRole('button', { name: 'Edit' }).click();
    const editor = page.getByRole('dialog', { name: 'Edit field' });
    await editor.getByRole('textbox', { name: 'Name' }).fill(renamed);
    await editor.getByRole('button', { name: 'Save' }).click();
    await expect(editor).toBeHidden();
    await page.reload();
    await expect(page.getByRole('row', { name: renamed })).toBeVisible();
    await expect(page.getByRole('row', { name: created, exact: true })).toHaveCount(0);
    await shot(page, 'LIB-028-field-edit');
  });

  test('LIB-031 resolve one exact duplicate pair as not a duplicate', async ({ page }) => {
    test.setTimeout(90_000);
    await ensureEnglish(page);
    const pairName = `lib-audit pair ${String(Date.now())}`;
    const bytes = await syntheticPdf(pairName);
    await uploadSynthetic(page, `${pairName}-a.pdf`, bytes);
    await uploadSynthetic(page, `${pairName}-b.pdf`, bytes);
    await page.goto('/documents/duplicates');
    const card = page
      .getByTestId('duplicate-set-review-card')
      .filter({ hasText: `${pairName}-a.pdf` });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'All: not duplicate' }).click();
    await card.getByTestId('duplicate-set-apply-decisions').click();
    await expect(card).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(`${pairName}-a.pdf`)).toHaveCount(0);
    await shot(page, 'LIB-031-resolved');
  });

  test('LIB-023 a second library page loads a distinct cursor', async ({ page }) => {
    test.setTimeout(180_000);
    await ensureEnglish(page);
    await ensureSecondDocumentPage(page);
    const pages: { cursor: string | null; titles: string[] }[] = [];
    page.on('response', (response) => {
      void (async () => {
        if (response.request().method() !== 'GET' || !response.ok()) {
          return;
        }
        const url = new URL(response.url());
        if (url.pathname !== '/v1/documents') {
          return;
        }
        pages.push({
          cursor: url.searchParams.get('cursor'),
          titles: readDocumentList(await response.json()).titles,
        });
      })();
    });
    await showClassicLibrary(page);
    const scroll = page.getByTestId('library-doc-virtual-scroll');
    await expect(scroll).toBeVisible();
    await expect
      .poll(async () => {
        await scroll.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        return pages.filter((entry) => entry.cursor).length;
      })
      .toBeGreaterThan(0);
    const cursors = pages.flatMap((entry) => (entry.cursor ? [entry.cursor] : []));
    expect(new Set(cursors).size).toBe(cursors.length);
    const firstTitles = new Set(pages.find((entry) => entry.cursor === null)?.titles ?? []);
    const laterTitle = pages
      .filter((entry) => entry.cursor)
      .flatMap((entry) => entry.titles)
      .find((title) => !firstTitles.has(title));
    if (!laterTitle) {
      throw new Error('second page did not include a title from outside the first page');
    }
    await expect
      .poll(async () => {
        await scroll.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        return page.getByRole('link', { name: laterTitle }).count();
      })
      .toBeGreaterThan(0);
    await shot(page, 'LIB-023-pagination');
  });
});
