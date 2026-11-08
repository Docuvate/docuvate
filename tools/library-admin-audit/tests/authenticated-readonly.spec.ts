// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { auditEmail, auditPassword, targetReachable, webBaseUrl } from './support/env';
import { loginWithDocumentedForm } from './support/login';

const READ_ONLY_ROUTES = [
  { id: 'LIB-012', path: '/' },
  { id: 'LIB-015', path: '/documents' },
  { id: 'LIB-024', path: '/documents/views' },
  { id: 'LIB-026', path: '/structure/labels' },
  { id: 'LIB-028', path: '/structure/recognized-fields' },
  { id: 'LIB-029', path: '/filesystem' },
  { id: 'LIB-031', path: '/documents/duplicates' },
  { id: 'LIB-032', path: '/settings' },
  { id: 'LIB-037', path: '/settings/connectors' },
] as const;

test.describe('authenticated read-only navigation', () => {
  test.beforeAll(async ({ request }) => {
    const up = await targetReachable(request);
    test.skip(!up, `BLOCKED: web target unreachable at ${webBaseUrl()}. Not a mocked pass.`);
    test.skip(
      !auditEmail() || !auditPassword(),
      'BLOCKED: set DOCUVATE_AUDIT_EMAIL and DOCUVATE_AUDIT_PASSWORD for one isolated synthetic account. This pack does not scrape sessions or secrets.'
    );
  });

  test.beforeEach(async ({ page }) => {
    const serverErrors: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${String(response.status())} ${response.url()}`);
      }
    });
    await loginWithDocumentedForm(page);
    await page.goto('/documents');
    expect(serverErrors, serverErrors.join('\n')).toEqual([]);
  });

  for (const route of READ_ONLY_ROUTES) {
    test(`${route.id} ${route.path} renders a heading and stays signed in`, async ({ page }) => {
      const serverErrors: string[] = [];
      page.on('response', (response) => {
        if (response.status() >= 500) {
          serverErrors.push(`${String(response.status())} ${response.url()}`);
        }
      });
      await page.goto(route.path);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(serverErrors, serverErrors.join('\n')).toEqual([]);
    });
  }

  test('LIB-016 library view switcher is present', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('radiogroup').first()).toBeVisible();
  });

  test('LIB-020 library search field is present and is not submitted', async ({ page }) => {
    await page.goto('/documents');
    await expect(
      page.getByRole('textbox', { name: /search documents|dokumente suchen/i })
    ).toBeVisible();
  });

  test('LIB-022 library sort control is present', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.getByRole('button', { name: /sort|sortierung/i })).toBeVisible();
  });

  test('LIB-037 connectors page does not fire import or connection probes', async ({ page }) => {
    const liveCalls: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (
        /\/import|dry-run|dry_run|test-connection|\/export/.test(url) &&
        request.method() !== 'GET'
      ) {
        liveCalls.push(`${request.method()} ${url}`);
      }
    });
    await page.goto('/settings/connectors');
    await expect(page.locator('h1').first()).toBeVisible();
    expect(liveCalls, liveCalls.join('\n')).toEqual([]);
  });
});
