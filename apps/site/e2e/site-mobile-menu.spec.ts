import { expect, test } from '@playwright/test';

async function openMobileMenu(page: import('@playwright/test').Page) {
  await page.locator('.mobile-nav-toggle').click();
  await expect(page.locator('.mobile-nav-sheet')).toBeVisible();
  await expect(page.locator('.mobile-nav-toggle')).toHaveAttribute('aria-expanded', 'true');
}

test.describe('mobile menu sheet', () => {
  test('menu is closed on initial load', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.mobile-nav-sheet')).toHaveCount(0);
    await expect(page.locator('.mobile-nav-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.landing-hero-title')).toBeVisible();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'dark');
      localStorage.setItem('docuvate-site-theme', 'dark');
    });
  });

  for (const width of [390, 412] as const) {
    test(`hero is covered by backdrop at ${width}px (dark)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 924 });
      await page.goto('/');
      await openMobileMenu(page);

      const hit = await page.evaluate(() => {
        const hero = document.querySelector('.landing-hero-band');
        if (!hero) return { ok: false, reason: 'no-hero' };
        const heroRect = hero.getBoundingClientRect();
        const x = window.innerWidth / 2;
        const y = Math.min(window.innerHeight - 48, heroRect.top + heroRect.height * 0.55);
        const el = document.elementFromPoint(x, y);
        if (!el) return { ok: false, reason: 'no-element' };
        const onBackdrop = Boolean(el.closest('.mobile-nav-backdrop'));
        const onHeroCopy = Boolean(
          el.closest('.landing-hero-title, .landing-hero-lead, .landing-hero-actions'),
        );
        return { ok: onBackdrop && !onHeroCopy, tag: el.tagName, className: String(el.className) };
      });

      expect(hit.ok).toBe(true);
    });
  }

  test('backdrop click and Escape close the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await openMobileMenu(page);
    await page.locator('.mobile-nav-backdrop').click({ force: true });
    await expect(page.locator('.mobile-nav-sheet')).toHaveCount(0);
    await expect(page.locator('.mobile-nav-toggle')).toHaveAttribute('aria-expanded', 'false');

    await openMobileMenu(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.mobile-nav-sheet')).toHaveCount(0);
  });

  test('CTA appears inside the sheet on landing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await openMobileMenu(page);
    const cta = page.locator('.mobile-nav-sheet .mobile-nav-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Selbst hosten');
  });
});
