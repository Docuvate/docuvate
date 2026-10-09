import { expect, test } from '@playwright/test';

const WIDTHS = [360, 390, 768, 1280] as const;

const PATHS = ['/', '/docs', '/docs/sdks', '/docs/api', '/impressum', '/en', '/en/docs', '/en/docs/api'] as const;

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectMainChildrenFit(page: import('@playwright/test').Page) {
  const offenders = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) {
      return [];
    }
    const bad: string[] = [];
    const hasClippingAncestor = (el: HTMLElement) => {
      let cur: HTMLElement | null = el.parentElement;
      while (cur && main.contains(cur)) {
        const ox = getComputedStyle(cur).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') {
          return true;
        }
        cur = cur.parentElement;
      }
      return false;
    };
    main.querySelectorAll('*').forEach((el) => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      if (hasClippingAncestor(el)) {
        return;
      }
      const parent = el.parentElement;
      if (!parent || !main.contains(parent)) {
        return;
      }
      if (el.offsetWidth > parent.clientWidth + 1) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 120));
      }
    });
    return bad.slice(0, 5);
  });
  expect(offenders).toEqual([]);
}

test.describe('site mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('docuvate-site-theme', 'light');
      localStorage.setItem('docuvate-site-locale', 'de');
      document.documentElement.setAttribute('data-docuvate-theme', 'light');
    });
  });

  for (const width of WIDTHS) {
    for (const path of PATHS) {
      test(`no horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        if (path.includes('/docs/api')) {
          await page.waitForTimeout(2000);
        }
        await expectNoHorizontalOverflow(page);
        if (width === 360 || width === 390) {
          await expectMainChildrenFit(page);
        }
      });
    }
  }

  test('mobile menu toggle meets touch target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.locator('.mobile-nav-toggle');
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(40);
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
    await toggle.click();
    await expect(page.locator('.mobile-nav-sheet')).toBeVisible();
  });
});
