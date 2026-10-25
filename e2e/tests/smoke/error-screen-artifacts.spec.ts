import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = path.join(process.cwd(), 'ce-ui-audit-output', 'error-scenes');

const SCENES = [
  {
    id: 'scene-unreachable',
    file: 'unreachable',
    testId: 'error-preview-scene-unreachable',
    errorVariantTestId: 'docuvate-error-server-unreachable',
    headlines: {
      de: 'Unsere Dokumente machen gerade Kaffeepause.',
      en: 'Our documents are on a coffee break.',
    },
  },
  {
    id: 'scene-offline',
    file: 'offline',
    testId: 'error-preview-scene-offline',
    errorVariantTestId: 'docuvate-error-browser-offline',
    headlines: {
      de: 'Kein Internet.',
      en: 'No internet.',
    },
  },
  {
    id: 'scene-not-found',
    file: 'not-found',
    testId: 'error-preview-scene-not-found',
    errorVariantTestId: 'docuvate-error-not-found',
    headlines: {
      de: 'Dieses Dokument haben wir nicht abgelegt.',
      en: 'We have not filed this document.',
    },
  },
  {
    id: 'scene-server',
    file: 'server-error',
    testId: 'error-preview-scene-server',
    errorVariantTestId: 'docuvate-error-server-error-page',
    headlines: {
      de: 'Der Server braucht einen kurzen Moment.',
      en: 'The server needs a short breather.',
    },
  },
  {
    id: 'scene-forbidden',
    file: 'forbidden',
    testId: 'error-preview-scene-forbidden',
    errorVariantTestId: 'docuvate-error-forbidden',
    headlines: {
      de: 'Kein Zugriff',
      en: 'Access denied',
    },
  },
  {
    id: 'scene-unexpected',
    file: 'unexpected',
    testId: 'error-preview-scene-unexpected',
    errorVariantTestId: 'docuvate-error-unexpected',
    headlines: {
      de: 'Hier ist etwas schiefgelaufen.',
      en: 'Something went sideways here.',
    },
  },
] as const;

test.describe('Error scene screenshot artifacts', () => {
  test('captures all mascot scenes (light/dark, DE/EN, desktop/mobile)', async ({ browser }) => {
    test.setTimeout(600_000);
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
          await expect(page.getByTestId(scene.errorVariantTestId)).toBeVisible();
          await expect(page.getByRole('heading', { level: 1, name: scene.headlines[locale] })).toBeVisible();

          const mascotImg = page.locator('.error-scene-mascot__img').first();
          await expect(mascotImg).toBeVisible();
          await mascotImg.evaluate((img) => {
            const el = img;
            if (!(el instanceof HTMLImageElement)) {
              throw new Error('Expected image element');
            }
            if (!el.complete || el.naturalWidth === 0) {
              throw new Error('Mascot image not loaded');
            }
          });

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
