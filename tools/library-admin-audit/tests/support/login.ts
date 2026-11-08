// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page } from '@playwright/test';

import { auditEmail, auditPassword } from './env';

/**
 * Sign in through the documented login form. Credentials come from the
 * operator's environment. This helper never reads browser profiles, cookie
 * jars, or secret files.
 */
export async function loginWithDocumentedForm(page: Page): Promise<void> {
  const email = auditEmail();
  const password = auditPassword();
  if (!email || !password) {
    throw new Error('DOCUVATE_AUDIT_EMAIL and DOCUVATE_AUDIT_PASSWORD are required');
  }
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}
