import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function headerBottomPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const header = document.querySelector('.site-header');
    return header ? header.getBoundingClientRect().bottom : 0;
  });
}

async function expectTargetBelowStickyHeader(page: Page, selector: string) {
  const bottom = await headerBottomPx(page);
  const top = await page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(bottom - 4);
}

async function initDeLight(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('docuvate-site-theme', 'light');
    localStorage.setItem('docuvate-site-locale', 'de');
    document.documentElement.setAttribute('data-docuvate-theme', 'light');
  });
}

test.describe('site marketing anchors', () => {
  test.beforeEach(async ({ page }) => {
    await initDeLight(page);
  });

  test('Selbst hosten CTAs target quickstart', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('.landing-btn-primary').first()).toHaveAttribute('href', '/docs#quickstart');
    await expect(page.locator('.header-cta')).toHaveAttribute('href', '/docs#quickstart');
    await page.goto('/docs/api');
    await expect(page.locator('.header-cta')).toHaveAttribute('href', '/docs#quickstart');
  });

  test('landing in-page anchor clicks clear sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    for (const id of ['library', 'chat'] as const) {
      await page.locator(`a[href="/#feature-${id}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`#feature-${id}$`));
      await expectTargetBelowStickyHeader(page, `#feature-${id}`);
      await page.goto('/');
    }
  });

  test('landing hash URLs load with targets below header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const hash of ['#feature-chat', '#integrations-heading', '#feature-library']) {
      await page.goto(`/${hash}`);
      await expectTargetBelowStickyHeader(page, hash);
    }
  });

  test('docs hash URLs and TOC navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const hash of ['#quickstart', '#concepts', '#self-hosting']) {
      await page.goto(`/docs${hash}`);
      await expectTargetBelowStickyHeader(page, hash);
    }

    await page.goto('/docs');
    const toc = page.locator('.docs-toc-desktop .docs-toc-link');
    await expect(toc.first()).toBeVisible();
    const count = await toc.count();
    expect(count).toBeGreaterThan(2);

    const clickedId = await toc.nth(2).getAttribute('data-toc-id');
    await toc.nth(2).click();
    await page.waitForTimeout(700);
    expect(clickedId).toBeTruthy();
    if (clickedId) {
      await expectTargetBelowStickyHeader(page, `#${clickedId}`);
      await expect(page.locator('.docs-toc-desktop .docs-toc-item.is-active .docs-toc-link')).toHaveAttribute(
        'data-toc-id',
        clickedId,
        { timeout: 3000 }
      );
    }

    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const lastId = await toc.nth(count - 1).getAttribute('data-toc-id');
    if (lastId) {
      await expect(page.locator('.docs-toc-desktop .docs-toc-item.is-active .docs-toc-link')).toHaveAttribute(
        'data-toc-id',
        lastId
      );
    }
  });

  test('DE API OpenAPI download link looks like a link and downloads JSON', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/docs/api');
    const downloadControl = page.locator('.scalar-embed-locale-de .download-button').first();
    await expect(downloadControl).toBeVisible({ timeout: 60_000 });

    const accentRgb = await downloadControl.evaluate((el) => {
      const afterColor = getComputedStyle(el, '::after').color;
      return afterColor;
    });
    expect(accentRgb).toMatch(/rgb\(203, 58, 0\)|rgb\(233, 111, 73\)/);

    const downloadPromise = page.waitForEvent('download');
    await downloadControl.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/openapi|\.json/);
    const path = await download.path();
    expect(path).toBeTruthy();
    if (path) {
      const text = readFileSync(path, 'utf8');
      const json = JSON.parse(text) as { openapi?: string; info?: { title?: string } };
      expect(json.openapi).toBeTruthy();
      expect(json.info?.title).toBeTruthy();
    }
  });

  test('SDK section hash navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/sdks#flutter-sdk');
    await expectTargetBelowStickyHeader(page, '#flutter-sdk');
    await page.goto('/docs/sdks#node-sdk');
    await expect(page).toHaveURL(/#node-sdk$/);
    await expectTargetBelowStickyHeader(page, '#node-sdk');
  });
});
