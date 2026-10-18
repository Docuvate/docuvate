import { expect, test } from '@playwright/test';

const MIN_LINES = 8;

async function expectTightLineLayout(panel: import('@playwright/test').Locator) {
  const sourceLines = Number(
    await panel.locator('.code-panel-shell').getAttribute('data-source-lines')
  );
  expect(sourceLines).toBeGreaterThanOrEqual(MIN_LINES);

  const body = panel.locator('.code-panel-body');
  const shikiLineCount = await body.locator('.line').count();
  expect(shikiLineCount).toBe(sourceLines);

  const metrics = await body.evaluate((el) => {
    const pre = el.querySelector('pre');
    const style = pre ? getComputedStyle(pre) : getComputedStyle(el);
    const lineHeight = Number.parseFloat(style.lineHeight) || 0;
    const height = (pre ?? el).getBoundingClientRect().height;
    return { lineHeight, height, whiteSpace: style.whiteSpace };
  });
  expect(metrics.whiteSpace).toMatch(/pre/);
  const expectedMin = metrics.lineHeight * sourceLines * 0.85;
  const expectedMax = metrics.lineHeight * sourceLines * 1.35;
  expect(metrics.height).toBeGreaterThanOrEqual(expectedMin);
  expect(metrics.height).toBeLessThanOrEqual(expectedMax);
}

test.describe('highlighted code blocks preserve line breaks', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-theme', 'light');
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
  });

  test('landing SDK block line count matches source without double spacing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/#dev-heading');
    const panel = page
      .locator('.landing-code-slot .code-panel')
      .filter({ hasText: 'DocuvateClient' });
    await expect(panel).toBeVisible();
    await expectTightLineLayout(panel);
  });

  test('mobile SDK install command is not clipped without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/sdks#node-sdk');
    const installPanel = page.locator('.code-panel').filter({ hasText: 'pnpm add' }).first();
    await expect(installPanel).toBeVisible();
    const metrics = await installPanel.evaluate((panel) => {
      const shell = panel.querySelector('.code-panel-shell');
      const body = panel.querySelector('.code-panel-body');
      if (!(shell instanceof HTMLElement) || !(body instanceof HTMLElement)) {
        return { ok: false, reason: 'missing-body' };
      }
      const fits = body.scrollWidth <= body.clientWidth + 1;
      const canScroll =
        body.scrollWidth > body.clientWidth + 1 && shell.dataset.scrollableX === 'true';
      return { ok: fits || canScroll, scrollable: shell.dataset.scrollableX };
    });
    expect(metrics.ok).toBe(true);
  });

  test('docs SDK search example line count matches source', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/sdks');
    const searchExample = page.locator('.code-panel').filter({ hasText: 'Dokumente suchen' });
    await expect(searchExample).toBeVisible();
    await expectTightLineLayout(searchExample);
  });
});
