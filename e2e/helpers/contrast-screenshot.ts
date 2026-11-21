// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { applyDocuvateLocale, applyDocuvateThemePreference } from './docuvate-theme';
import { parseDocumentListBody } from './json-body';

const THEME_ATTRIBUTE = 'data-docuvate-theme';
/** The smoke seed runs concurrently with Playwright setup; its pipeline timeout is 360 s. */
const SMOKE_READY_DOCUMENT_TIMEOUT_MS = 360_000;

export type ContrastLocale = 'de' | 'en';
export type ContrastTheme = 'light' | 'dark';

export async function resolveSmokeReadyDocumentPath(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<string> {
  let readyDocumentId: string | undefined;
  await expect
    .poll(
      async () => {
        const documentsRes = await request.get(`${apiBase}/v1/documents?status=ready`, {
          headers: { origin: webOrigin },
        });
        expect(documentsRes.ok()).toBeTruthy();
        const [firstReady] = parseDocumentListBody(await documentsRes.json());
        readyDocumentId = firstReady?.id;
        return readyDocumentId !== undefined;
      },
      {
        message: 'smoke seed has no ready document yet',
        timeout: SMOKE_READY_DOCUMENT_TIMEOUT_MS,
        intervals: [2_000, 5_000],
      }
    )
    .toBe(true);
  if (readyDocumentId === undefined) {
    throw new Error('smoke seed produced no ready document');
  }
  return `/documents/${readyDocumentId}`;
}

export async function applyContrastLocale(page: Page, locale: ContrastLocale): Promise<void> {
  await applyDocuvateLocale(page, locale);
  await page.evaluate((lng) => {
    window.localStorage.setItem('i18nextLng', lng);
  }, locale);
}

export async function applyContrastTheme(page: Page, theme: ContrastTheme): Promise<void> {
  await applyDocuvateThemePreference(page, theme);
  await assertContrastTheme(page, theme);
}

export async function assertContrastTheme(page: Page, theme: ContrastTheme): Promise<void> {
  const onHtml = await page.evaluate((attr) => {
    return document.documentElement.getAttribute(attr);
  }, THEME_ATTRIBUTE);
  expect(onHtml).toBe(theme);
}

export async function waitForContrastPageReady(
  page: Page,
  slug: string,
  documentDetailPath: string,
  webOrigin: string
): Promise<void> {
  if (slug === 'documents' || slug === 'documents-de') {
    await page
      .getByTestId('library-doc-virtual-scroll')
      .waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (slug === 'labels') {
    await page.locator('main').waitFor({ state: 'visible', timeout: 60_000 });
    await page.locator('.labels-coverage-block').waitFor({ state: 'visible', timeout: 60_000 });
    await expect(page.getByText(/Loading coverage|Abdeckung wird geladen/)).toHaveCount(0);
    await expect(page.getByText(/Loading suggestions|Lade Vorschläge/)).toHaveCount(0);
    return;
  }

  if (slug === 'connectors') {
    await page.locator('.connector-catalog-grid .connector-catalog-card').first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    return;
  }

  if (slug === 'filesystem') {
    await page
      .locator('.dateisystem-content-header')
      .waitFor({ state: 'visible', timeout: 60_000 });
    return;
  }

  if (slug === 'document-detail' || slug === 'document-detail-de') {
    const detailUrl = new URL(documentDetailPath, webOrigin).href;
    await expect(page).toHaveURL(detailUrl);
    await page.locator('.document-detail-page').waitFor({ state: 'visible', timeout: 60_000 });
    await page.locator('.document-detail-back-link').waitFor({ state: 'visible', timeout: 60_000 });
    await page.locator('.pdf-viewer-toolbar').waitFor({ state: 'visible', timeout: 90_000 });
    return;
  }

  await page.locator('#root').waitFor({ state: 'attached', timeout: 60_000 });
}

export function routePathForSlug(slug: string, documentDetailPath: string): string {
  if (slug === 'documents' || slug === 'documents-de') {
    return '/documents';
  }
  if (slug === 'labels') {
    return '/structure/labels';
  }
  if (slug === 'connectors') {
    return '/settings/connectors';
  }
  if (slug === 'filesystem') {
    return '/filesystem';
  }
  if (slug === 'document-detail' || slug === 'document-detail-de') {
    return documentDetailPath;
  }
  if (slug === 'dashboard') {
    return '/';
  }
  if (slug === 'settings') {
    return '/settings';
  }
  return '/';
}
