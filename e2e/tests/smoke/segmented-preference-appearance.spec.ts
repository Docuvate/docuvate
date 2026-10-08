import { expect, test, type BrowserContext } from '@playwright/test';

const email =
  process.env['SCREENSHOT_USER_EMAIL'] ?? 'segmented-preference-e2e@fixture.docuvate.test';
const password = process.env['SCREENSHOT_USER_PASSWORD'] ?? 'SegmentedPrefE2e2026!';

type Rgb = { r: number; g: number; b: number };

function parseRgb(color: string): Rgb | null {
  const rgb = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  const rgba = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)$/);
  if (rgba) {
    return { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]) };
  }
  return null;
}

function luminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: string, b: string): number {
  const ca = parseRgb(a);
  const cb = parseRgb(b);
  if (!ca || !cb) {
    throw new Error(`unsupported colors for contrast: ${a} vs ${b}`);
  }
  const l1 = luminance(ca);
  const l2 = luminance(cb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function apiLogin(context: BrowserContext, webOrigin: string) {
  const authHeaders = { Origin: webOrigin, Referer: `${webOrigin}/` };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let res = await context.request.post(`${webOrigin}/api/auth/sign-in/email`, {
      headers: authHeaders,
      data: { email, password },
    });
    if (res.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!res.ok()) {
      await context.request.post(`${webOrigin}/api/auth/sign-up/email`, {
        headers: authHeaders,
        data: { email, password, name: 'Segmented preference E2E' },
      });
      res = await context.request.post(`${webOrigin}/api/auth/sign-in/email`, {
        headers: authHeaders,
        data: { email, password },
      });
    }
    if (res.ok()) {
      return;
    }
    if (res.status() === 429) {
      continue;
    }
    throw new Error(`login failed ${res.status()}`);
  }
  throw new Error('login rate limited');
}

async function assertSegmentPair(page: import('@playwright/test').Page, rootSelector: string) {
  const result = await page.evaluate((selector) => {
    const root = document.querySelector(selector);
    if (!root) {
      return { ok: false, reason: `missing ${selector}` };
    }
    const options = [...root.querySelectorAll('[role="radio"]')];
    if (options.length < 2) {
      return { ok: false, reason: 'expected at least 2 radio options' };
    }
    const styles = options.map((el) => {
      const cs = getComputedStyle(el);
      return {
        selected: el.getAttribute('aria-checked') === 'true',
        backgroundColor: cs.backgroundColor,
        borderTopWidth: cs.borderTopWidth,
        borderTopColor: cs.borderTopColor,
        borderRadius: cs.borderRadius,
        height: cs.height,
      };
    });
    return { ok: true, styles };
  }, rootSelector);

  expect(result.ok, result.reason).toBe(true);
  if (!result.ok || !('styles' in result)) {
    return;
  }
  const { styles } = result;
  const selected = styles.filter((s) => s.selected);
  const unselected = styles.filter((s) => !s.selected);
  expect(selected).toHaveLength(1);
  expect(unselected.length).toBeGreaterThanOrEqual(1);

  const unselectedStyles = unselected.map((s) => ({
    backgroundColor: s.backgroundColor,
    borderTopWidth: s.borderTopWidth,
    borderTopColor: s.borderTopColor,
    borderRadius: s.borderRadius,
    height: s.height,
  }));
  for (let i = 1; i < unselectedStyles.length; i += 1) {
    expect(unselectedStyles[i]).toEqual(unselectedStyles[0]);
  }

  const bgContrast = contrastRatio(selected[0]!.backgroundColor, unselected[0]!.backgroundColor);
  expect(bgContrast).toBeGreaterThanOrEqual(1.3);
}

async function waitForLibrary(page: import('@playwright/test').Page) {
  await page.locator('.library-doc-table-card, .library-documents-panel').first().waitFor({
    timeout: 30_000,
  });
}

test.describe('Segmented preference appearance', () => {
  test('topbar and menu segments meet contrast and placement rules', async ({ page, baseURL }) => {
    const origin = baseURL ?? 'http://localhost:5173';
    await apiLogin(page.context(), origin);
    await page.goto('/documents');
    await waitForLibrary(page);

    await page.evaluate(() => {
      localStorage.setItem('docuvate-theme-preference', 'light');
      localStorage.setItem('docuvate-theme', 'light');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
    await page.reload();
    await waitForLibrary(page);
    await assertSegmentPair(page, '.locale-switcher-wrap--topbar .segmented-control');

    await page.evaluate(() => {
      localStorage.setItem('docuvate-theme-preference', 'dark');
      localStorage.setItem('docuvate-theme', 'dark');
      document.documentElement.setAttribute('data-docuvate-theme', 'dark');
    });
    await page.reload();
    await waitForLibrary(page);
    await assertSegmentPair(page, '.locale-switcher-wrap--topbar .segmented-control');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await waitForLibrary(page);
    await page.locator('.user-account-menu-trigger').click();
    await expect(page.locator('.user-account-menu-panel')).toBeVisible();
    await assertSegmentPair(page, '.locale-switcher-wrap--menu .segmented-control');
    await assertSegmentPair(page, '.user-account-menu-theme .segmented-control');
  });
});
