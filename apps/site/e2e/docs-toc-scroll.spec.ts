import { expect, test } from '@playwright/test';

test.describe('docs TOC scroll spy', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-theme', 'light');
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/sdks');
    await expect(page.locator('.docs-toc-desktop')).toBeVisible();
  });

  test('each heading scroll position activates matching TOC aria-current', async ({ page }) => {
    const ids = await page
      .locator('.docs-toc-desktop .docs-toc-link')
      .evaluateAll((links) =>
        links.map((a) => a.getAttribute('data-toc-id')).filter((id): id is string => Boolean(id))
      );
    expect(ids.length).toBeGreaterThan(3);

    for (const id of ids) {
      await page.evaluate((headingId) => {
        const el = document.getElementById(headingId);
        if (!el) return;
        const raw = getComputedStyle(document.documentElement)
          .getPropertyValue('--site-header-height')
          .trim();
        const n = parseFloat(raw);
        const headerPx = Number.isFinite(n) ? (raw.endsWith('rem') ? n * 16 : n) : 68;
        const offset = headerPx + 16;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      }, id);
      await page.waitForTimeout(80);
      await expect(page.locator(`.docs-toc-desktop a[data-toc-id="${id}"]`)).toHaveAttribute(
        'aria-current',
        'location'
      );
    }
  });

  test('active item advances monotonically when scrolling down and up', async ({ page }) => {
    const ids = await page
      .locator('.docs-toc-desktop .docs-toc-link')
      .evaluateAll((links) =>
        links.map((a) => a.getAttribute('data-toc-id')).filter((id): id is string => Boolean(id))
      );
    expect(ids.length).toBeGreaterThan(3);

    const activeIndex = async () => {
      const activeId = await page
        .locator(
          '.docs-toc-desktop .docs-toc-item.is-active .docs-toc-link, .docs-toc-desktop a[aria-current="location"]'
        )
        .first()
        .getAttribute('data-toc-id');
      return ids.indexOf(activeId ?? '');
    };

    let lastDown = await activeIndex();
    const steps = 14;
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, 380);
      await page.waitForTimeout(100);
      const idx = await activeIndex();
      expect(idx).toBeGreaterThanOrEqual(lastDown);
      lastDown = idx;
    }

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    );
    await page.waitForTimeout(150);
    const atBottom = await activeIndex();
    expect(atBottom).toBe(ids.length - 1);

    let lastUp = atBottom;
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, -380);
      await page.waitForTimeout(100);
      const idx = await activeIndex();
      expect(idx).toBeLessThanOrEqual(lastUp);
      lastUp = idx;
    }
  });
});

test.describe('docs mobile TOC anchor offset', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-theme', 'light');
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
  });

  test('Node.js heading clears mobile Auf dieser Seite bar at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/sdks');
    await expect(page.locator('.docs-toc-mobile-bar')).toBeVisible();
    await page.locator('.docs-toc-mobile-bar-trigger').click();
    await page.getByRole('button', { name: 'Node.js und TypeScript', exact: true }).click();
    await page.waitForTimeout(400);
    const layout = await page.evaluate(() => {
      const heading = document.getElementById('node-sdk');
      const bar = document.querySelector('.docs-toc-mobile-bar');
      if (!heading || !bar) return { ok: false };
      const hr = heading.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      return { ok: hr.top >= br.bottom - 2, top: hr.top, barBottom: br.bottom };
    });
    expect(layout.ok).toBe(true);
  });

  test('mobile TOC bar sits flush under site header at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/sdks');
    await page.locator('.docs-toc-mobile-bar-trigger').click();
    await page.getByRole('button', { name: 'Node.js und TypeScript', exact: true }).click();
    await page.waitForTimeout(400);
    const aligned = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const bar = document.querySelector('.docs-toc-mobile-bar');
      if (!header || !bar) return false;
      const hb = header.getBoundingClientRect().bottom;
      const bt = bar.getBoundingClientRect().top;
      return Math.abs(bt - hb) <= 1;
    });
    expect(aligned).toBe(true);
  });

  test('env tables do not horizontal-scroll at 390 on /docs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs#self-hosting');
    await page.waitForSelector('.env-table-wrap', { timeout: 30_000 });
    await page.waitForTimeout(400);
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll('.env-table-wrap').forEach((wrap) => {
        const el = wrap as HTMLElement;
        if (el.scrollWidth > el.clientWidth + 1) {
          bad.push(`overflow:${el.clientWidth}/${el.scrollWidth}`);
        }
      });
      return bad;
    });
    expect(offenders).toEqual([]);
  });

  test('SDK install code blocks do not horizontal-scroll at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/docs/sdks');
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll('.docs-prose pre.shiki').forEach((pre) => {
        const r = pre.getBoundingClientRect();
        if (r.width < 1) return;
        if (pre.scrollWidth > pre.clientWidth + 2) {
          bad.push(
            pre.closest('.code-panel-shell')?.querySelector('.code-panel-filename')?.textContent ??
              'pre'
          );
        }
      });
      return bad;
    });
    expect(offenders).toEqual([]);
  });
});
