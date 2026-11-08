// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { targetReachable, webBaseUrl } from './support/env';

const ANONYMOUS_REDIRECTS = [
  '/documents',
  '/documents/duplicates',
  '/documents/views',
  '/structure/labels',
  '/structure/recognized-fields',
  '/filesystem',
  '/settings',
  '/settings/connectors',
] as const;

test.describe('public read-only navigation', () => {
  test.beforeAll(async ({ request }) => {
    const up = await targetReachable(request);
    test.skip(
      !up,
      `BLOCKED: web target unreachable at ${webBaseUrl()}. This is an environment block, not a product result and not a mocked pass.`
    );
  });

  test('LIB-001 login form is shown without a session', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test('LIB-002 register page is reachable', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('LIB-003 forgot-password page is reachable and does not submit', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  for (const path of ANONYMOUS_REDIRECTS) {
    test(`anonymous ${path} returns to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
