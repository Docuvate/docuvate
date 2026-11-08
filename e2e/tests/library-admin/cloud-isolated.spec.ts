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
});
