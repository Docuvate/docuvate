// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Page } from '@playwright/test';

export const RAW_I18N_KEY = /\b[a-z][a-zA-Z]*\.[a-zA-Z]+(\.[a-zA-Z]+)+\b/;

export const CE_AUTHENTICATED_ROUTES: { path: string; slug: string }[] = [
  { path: '/', slug: 'start' },
  { path: '/documents', slug: 'documents' },
  { path: '/chat', slug: 'chat' },
  { path: '/structure/labels', slug: 'labels' },
  { path: '/structure/recognized-fields', slug: 'recognized-fields' },
  { path: '/filesystem', slug: 'filesystem' },
  { path: '/settings', slug: 'settings' },
  { path: '/settings/connectors', slug: 'settings-connectors' },
  { path: '/settings/blocked-labels', slug: 'settings-blocked-labels' },
  { path: '/settings/account-security', slug: 'settings-account-security' },
  { path: '/settings/admin', slug: 'settings-admin' },
  { path: '/review', slug: 'review' },
];

export const CE_PUBLIC_AUTH_ROUTES: { path: string; slug: string }[] = [
  { path: '/login', slug: 'login' },
  { path: '/register', slug: 'register' },
  { path: '/forgot-password', slug: 'forgot-password' },
  { path: '/reset-password', slug: 'reset-password' },
];

export async function setLocale(page: Page, locale: 'de' | 'en'): Promise<void> {
  const group = page.locator('.locale-switcher-wrap--topbar .segmented-control');
  if ((await group.count()) === 0) {
    return;
  }
  const label = locale === 'de' ? /^DE$/i : /^EN$/i;
  await group.getByRole('radio', { name: label }).click();
}

export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.evaluate((next) => {
    window.localStorage.setItem('docuvate-theme-preference', next);
    window.localStorage.setItem('docuvate-theme', next);
    document.documentElement.setAttribute('data-docuvate-theme', next);
    window.dispatchEvent(new CustomEvent('docuvate-theme-preference-change'));
  }, theme);
}

export function auditArtifactRoot(): string {
  return process.env['CE_UI_AUDIT_DIR'] ?? path.join(process.cwd(), 'ce-ui-audit-output');
}

export async function ensureAuditDir(segment: string): Promise<string> {
  const dir = path.join(auditArtifactRoot(), segment);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function attachPageAudit(page: Page): {
  consoleErrors: string[];
  failedRequests: string[];
} {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && (url.includes('/v1/') || url.includes('/api/auth/'))) {
      failedRequests.push(`${res.status()} ${url}`);
    }
  });
  return { consoleErrors, failedRequests };
}

export function findRawI18nSnippets(bodyText: string): string[] {
  return [...bodyText.matchAll(RAW_I18N_KEY)].map((match) => match[0]);
}
