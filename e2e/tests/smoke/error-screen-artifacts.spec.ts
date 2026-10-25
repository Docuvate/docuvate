import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'ce-ui-audit-output', 'error-scenes');

type Theme = 'light' | 'dark';
type Locale = 'de' | 'en';

const SCENES = [
  {
    id: 'scene-unreachable',
    file: 'unreachable',
    testId: 'error-preview-scene-unreachable',
    headlines: {
      de: 'Unsere Dokumente machen gerade Kaffeepause.',
      en: 'Our documents are on a coffee break.',
    },
  },
  {
    id: 'scene-offline',
    file: 'offline',
    testId: 'error-preview-scene-offline',
    headlines: {
      de: 'Kein Internet.',
      en: 'No internet.',
    },
  },
  {
    id: 'scene-not-found',
    file: 'not-found',
    testId: 'error-preview-scene-not-found',
    headlines: {
      de: 'Dieses Dokument haben wir nicht abgelegt.',
      en: 'We have not filed this document.',
    },
  },
] as const;

test.describe('Error scene screenshot artifacts', () => {
  test('captures unreachable, offline, not-found (light/dark, DE/EN, desktop/mobile)', async ({ browser }) => {
    fs.mkdirSync(artifactDir, { recursive: true });

    for (const scene of SCENES) {
      for (const locale of ['de', 'en'] as const) {
        for (const theme of ['light', 'dark'] as const) {
          const context = await browser.newContext();
          await context.addInitScript(
            ({ themeValue, localeValue }) => {
              localStorage.setItem('docuvate-theme-preference', themeValue);
              localStorage.setItem('docuvate-theme', themeValue);
              document.documentElement.setAttribute('data-docuvate-theme', themeValue);
              localStorage.setItem('docuvate.locale', localeValue);
            },
            { themeValue: theme, localeValue: locale }
          );

          const page = await context.newPage();
          await page.setViewportSize({ width: 1280, height: 800 });
          await page.goto(`/docs/errors/previews/${scene.id}?lang=${locale}`, { waitUntil: 'networkidle' });

          await expect(page.getByTestId(scene.testId)).toBeVisible();
          await expect(page.getByTestId(`docuvate-error-${scene.id === 'scene-offline' ? 'browser-offline' : scene.id === 'scene-not-found' ? 'not-found' : 'server-unreachable'}`)).toBeVisible();
          await expect(page.getByRole('heading', { level: 1, name: scene.headlines[locale] })).toBeVisible();

          const themeAttr = await page.locator('html').getAttribute('data-docuvate-theme');
          expect(themeAttr).toBe(theme);

          await page.screenshot({
            path: path.join(artifactDir, `${scene.file}-${theme}-${locale}-desktop.png`),
            fullPage: true,
          });

          await page.setViewportSize({ width: 390, height: 844 });
          await expect(page.getByRole('heading', { level: 1, name: scene.headlines[locale] })).toBeVisible();
          await page.screenshot({
            path: path.join(artifactDir, `${scene.file}-${theme}-${locale}-mobile.png`),
            fullPage: true,
          });

          await context.close();
        }
      }
    }
  });
});
