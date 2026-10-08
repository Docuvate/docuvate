import type { Page } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FittsCollector } from './fitts-collector.js';
import type { FittsTaskResult, ViewportLabel } from '../metrics/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PDF = path.join(__dirname, '../../fixtures/metrics-sample.pdf');

async function setRangeValue(page: Page, locator: ReturnType<Page['locator']>, value: string): Promise<void> {
  await locator.evaluate((el, next) => {
    const input = el as HTMLInputElement;
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function dirtyRecognizedFieldGateDefaults(page: Page): Promise<void> {
  await page.locator('.recognized-fields-defaults-card').scrollIntoViewIfNeeded();
  const checkbox = page
    .locator('.recognized-fields-defaults-card .recognized-field-label-checklist input[type="checkbox"]')
    .first();
  const count = await checkbox.count();
  if (count > 0) {
    await checkbox.evaluate((el) => {
      (el as HTMLInputElement).click();
    });
    return;
  }
  const slider = page.locator('.recognized-fields-defaults-card .confidence-threshold-slider__input').first();
  await slider.waitFor({ state: 'attached', timeout: 30_000 });
  const current = Number.parseFloat((await slider.inputValue()) || '0.62');
  const next = current > 0.56 ? (current - 0.03).toFixed(2) : (current + 0.03).toFixed(2);
  await slider.fill(next);
}

export interface TaskSeed {
  sampleDocumentTitle: string;
  sampleDocumentId: string;
  metricsFolderName: string;
}

async function login(page: Page, base: string, email: string, password: string): Promise<void> {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/documents/, { timeout: 60_000 });
}

async function trackClick(
  page: Page,
  collector: FittsCollector,
  locator: ReturnType<Page['locator']>
): Promise<void> {
  await collector.recordLocator(locator);
  await locator.click();
}

export async function runFittsTasksForViewport(
  page: Page,
  base: string,
  email: string,
  password: string,
  seed: TaskSeed,
  viewport: ViewportLabel,
  width: number,
  height: number,
  skippedTaskIds?: Set<string>
): Promise<FittsTaskResult[]> {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await login(page, base, email, password);

  const results: FittsTaskResult[] = [];

  async function runTask(
    taskId: string,
    label: string,
    fn: (c: FittsCollector) => Promise<boolean | void>
  ) {
    if (skippedTaskIds?.has(taskId)) {
      return;
    }
    const collector = new FittsCollector(FittsCollector.initialPointer(width, height));
    const skip = await fn(collector);
    if (skip === true) {
      skippedTaskIds?.add(taskId);
      return;
    }
    results.push(collector.finish(taskId, label, viewport));
  }

  await runTask('upload-document', 'Upload a document', async (c) => {
    await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
    const uploadBtn = page.locator('.upload-dropzone button, .upload-compact-bar button').first();
    await trackClick(page, c, uploadBtn);
    const input = page.locator('input[type="file"]').first();
    await c.recordLocator(input);
    await input.setInputFiles(FIXTURE_PDF);
    await page.waitForTimeout(1500);
  });

  await runTask('open-document', 'Open a document from the library', async (c) => {
    await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
    const scoped = page.locator(
      `.library-page a[href="/documents/${seed.sampleDocumentId}"], .library-page a.doc-card-link[href="/documents/${seed.sampleDocumentId}"]`
    );
    const link = (await scoped.count()) > 0 ? scoped.first() : page.locator('.library-page a[href^="/documents/"]').first();
    await link.waitFor({ state: 'attached', timeout: 30_000 });
    await trackClick(page, c, link);
    await page.waitForURL(/\/documents\/[^/?#]+$/, { timeout: 30_000 });
  });

  await runTask('assign-label', 'Assign a label on document detail', async (c) => {
    await page.goto(`${base}/documents/${seed.sampleDocumentId}`, { waitUntil: 'networkidle' });
    const labelsTab = page.getByRole('tab', { name: 'Labels' });
    await trackClick(page, c, labelsTab);
    const input = page.getByLabel('Label-Name für Zuweisung oder Neuanlage');
    await trackClick(page, c, input);
    await page.waitForTimeout(600);
    const pickerItem = page.locator('.label-picker-item').first();
    if ((await pickerItem.count()) > 0) {
      await trackClick(page, c, pickerItem);
    } else {
      await input.fill(`Metrik Zuweisung ${Date.now() % 100000}`);
      const addBtn = page.locator('.label-add-form button[type="submit"]');
      if (!(await addBtn.isDisabled())) {
        await trackClick(page, c, addBtn);
      }
    }
    await page.waitForTimeout(800);
  });

  await runTask('create-label', 'Create a label in structure', async (c) => {
    await page.goto(`${base}/structure/labels`, { waitUntil: 'networkidle' });
    const newBtn = page.getByRole('button', { name: 'Neues Label' });
    await trackClick(page, c, newBtn);
    const nameInput = page.locator('.labels-page input').first();
    await trackClick(page, c, nameInput);
    await nameInput.fill(`Metrik Label ${Date.now() % 100000}`);
    const saveBtn = page.locator('form button[type="submit"]').first();
    await trackClick(page, c, saveBtn);
    await page.waitForTimeout(800);
  });

  await runTask('create-recognized-field', 'Create a recognized field', async (c) => {
    await page.goto(`${base}/structure/recognized-fields`, { waitUntil: 'networkidle' });
    const addBtn = page.getByRole('button', { name: 'Feld hinzufügen' }).first();
    await trackClick(page, c, addBtn);
    const dialog = page.locator('.recognized-field-edit-dialog');
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });
    const labelInput = dialog.locator('input').first();
    await trackClick(page, c, labelInput);
    await labelInput.fill(`Metrik Feld ${Date.now() % 100000}`);
    const saveField = dialog.getByRole('button', { name: /Speichern|Anlegen/i }).first();
    await trackClick(page, c, saveField);
    await page.waitForTimeout(800);
  });

  await runTask('change-confidence-save', 'Change confidence threshold and save', async (c) => {
    await page.goto(`${base}/structure/recognized-fields`, { waitUntil: 'networkidle' });
    await dirtyRecognizedFieldGateDefaults(page);
    const saveBarBtn = page.locator('[data-ux="save-bar"] [data-ux="primary-action"]');
    await saveBarBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await trackClick(page, c, saveBarBtn);
    await page.waitForTimeout(800);
  });

  await runTask('folder-create-move', 'Create folder and move a document', async (c) => {
    await page.goto(`${base}/filesystem`, { waitUntil: 'networkidle' });
    const newRoot = page.getByRole('button', { name: 'Neuer Ordner' });
    if (await newRoot.isVisible().catch(() => false)) {
      await trackClick(page, c, newRoot);
      const nameInput = page.locator('.dateisystem-page input').first();
      await trackClick(page, c, nameInput);
      await nameInput.fill(seed.metricsFolderName);
      const confirm = page.locator('.dateisystem-page button[type="submit"]').first();
      await trackClick(page, c, confirm);
      await page.waitForTimeout(800);
    }
    await page.goto(`${base}/documents/${seed.sampleDocumentId}`, { waitUntil: 'networkidle' });
    const detailsTab = page.getByRole('tab', { name: 'Details' });
    await trackClick(page, c, detailsTab);
    const folderSelect = page.getByLabel('Ordner', { exact: true });
    await trackClick(page, c, folderSelect);
    const folderOption = page.getByRole('option', { name: seed.metricsFolderName });
    if (await folderOption.isVisible().catch(() => false)) {
      await trackClick(page, c, folderOption);
    } else {
      const fallback = page.getByRole('option').nth(1);
      if (await fallback.isVisible().catch(() => false)) {
        await trackClick(page, c, fallback);
      }
    }
    const saveMeta = page.locator('[data-ux="save-bar"] button[data-ux="primary-action"]').first();
    if (!(await saveMeta.isVisible().catch(() => false))) {
      const titleInput = page.locator('.document-metadata-fields input').first();
      await titleInput.fill(`Metrik Ordner ${Date.now() % 1000}`);
    }
    await saveMeta.waitFor({ state: 'visible', timeout: 10_000 });
    await trackClick(page, c, saveMeta);
    await page.waitForTimeout(800);
  });

  await runTask('search', 'Global search', async (c) => {
    await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
    const trigger = page.locator('.global-search-trigger:visible, .global-search-mobile-trigger:visible').first();
    await trackClick(page, c, trigger);
    const palette = page.locator('[data-ux="search-palette"]');
    await palette.waitFor({ state: 'visible', timeout: 10_000 });
    await palette.getByRole('combobox').fill('Finanzplan');
    await palette.locator('[data-ux="search-result"]').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
  });

  await runTask('switch-theme', 'Switch theme', async (c) => {
    await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
    const accountBtn = page.locator('.user-account-menu-trigger');
    await trackClick(page, c, accountBtn);
    const dark = page.getByRole('radio', { name: 'Dunkel' });
    await trackClick(page, c, dark);
    await page.waitForTimeout(400);
    // Untracked reset: the theme is stored on the account, and the layout screenshots
    // and contrast checks that follow must run in the default light theme.
    const light = page.getByRole('radio', { name: 'Hell' });
    if (!(await light.isVisible())) {
      await accountBtn.click();
    }
    await light.click();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
  });

  await runTask('change-setting-save', 'Change a setting and save', async (c) => {
    await page.goto(`${base}/settings`, { waitUntil: 'networkidle' });
    const toggle = page.getByRole('switch', { name: /Erweiterte Funktionen aktivieren/i });
    await toggle.scrollIntoViewIfNeeded();
    await c.recordLocator(toggle);
    await toggle.click({ force: true });
    await page.waitForTimeout(600);
  });

  await runTask('recognized-fields-save-bar', 'Save Erkannte Felder via SaveBar', async (c) => {
    await page.goto(`${base}/structure/recognized-fields`, { waitUntil: 'networkidle' });
    await dirtyRecognizedFieldGateDefaults(page);
    const saveBar = page.locator('[data-ux="save-bar"] button[data-ux="primary-action"]');
    await saveBar.waitFor({ state: 'visible', timeout: 10_000 });
    await trackClick(page, c, saveBar);
    await page.waitForTimeout(800);
  });

  await runTask('search-palette-open-result', 'Open global search palette and pick a result', async (c) => {
    await page.goto(`${base}/documents`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+KeyK');
    const palette = page.locator('[data-ux="search-palette"]');
    const paletteVisible = await palette
      .waitFor({ state: 'visible', timeout: 2500 })
      .then(() => true)
      .catch(() => false);
    if (!paletteVisible) {
      await page.keyboard.press('Escape').catch(() => undefined);
      return true;
    }
    await c.recordLocator(palette);
    const recent = palette.locator('[data-ux="search-recent-document"]').first();
    const hasRecent = await recent
      .waitFor({ state: 'visible', timeout: 2500 })
      .then(() => true)
      .catch(() => false);
    let result = recent;
    if (!hasRecent) {
      await palette.getByRole('combobox').fill(seed.sampleDocumentTitle.split(' ')[0] ?? '');
      result = palette.locator('[data-ux="search-result"]').first();
      await result.waitFor({ state: 'visible', timeout: 10_000 });
    }
    await trackClick(page, c, result);
    await page.waitForURL(/\/documents\/[^/]+$/, { timeout: 10_000 });
    await page.waitForTimeout(800);
  });

  await runTask('document-title-save', 'Change document title and save', async (c) => {
    await page.goto(`${base}/documents/${seed.sampleDocumentId}`, { waitUntil: 'networkidle' });
    const detailsTab = page.getByRole('tab', { name: 'Details' });
    await trackClick(page, c, detailsTab);
    const titleInput = page.locator('.document-metadata-fields input').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10_000 });
    await trackClick(page, c, titleInput);
    await titleInput.fill(`Metrik Titel ${Date.now() % 1000}`);
    const saveBtn = page.locator('[data-ux="save-bar"] button[data-ux="primary-action"]').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await trackClick(page, c, saveBtn);
    await page.waitForTimeout(800);
  });

  return results;
}
