import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'ce-ui-audit-output', 'error-scenes');

type Theme = 'light' | 'dark';
type Locale = 'de' | 'en';

async function applyThemeAndLocale(page: import('@playwright/test').Page, theme: Theme, locale: Locale) {
  await page.addInitScript(
    ({ themeValue, localeValue }) => {
      localStorage.setItem('docuvate-theme-preference', themeValue);
      localStorage.setItem('docuvate-theme', themeValue);
      document.documentElement.setAttribute('data-docuvate-theme', themeValue);
      localStorage.setItem('docuvate.locale', localeValue);
    },
    { themeValue: theme, localeValue: locale }
  );
}

test.describe('Error scene screenshot artifacts', () => {
  test('captures unreachable, offline, not-found (light/dark, DE/EN, desktop/mobile)', async ({ page }) => {
    fs.mkdirSync(artifactDir, { recursive: true });

    const scenes = [
      { id: 'scene-unreachable', file: 'unreachable' },
      { id: 'scene-offline', file: 'offline' },
      { id: 'scene-not-found', file: 'not-found' },
    ] as const;

    for (const scene of scenes) {
      for (const locale of ['de', 'en'] as const) {
        for (const theme of ['light', 'dark'] as const) {
          await applyThemeAndLocale(page, theme, locale);
          await page.setViewportSize({ width: 1280, height: 800 });
          await page.goto(`/docs/errors/previews/${scene.id}`);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          const themeAttr = await page.locator('html').getAttribute('data-docuvate-theme');
          expect(themeAttr).toBe(theme);
          await page.screenshot({
            path: path.join(artifactDir, `${scene.file}-${theme}-${locale}-desktop.png`),
            fullPage: true,
          });

          await page.setViewportSize({ width: 390, height: 844 });
          await page.screenshot({
            path: path.join(artifactDir, `${scene.file}-${theme}-${locale}-mobile.png`),
            fullPage: true,
          });
        }
      }
    }
  });
});
