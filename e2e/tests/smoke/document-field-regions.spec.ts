// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test, type Page } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import {
  openLayoutDocumentPage,
  uploadLayoutTableDocument,
} from '../../helpers/layout-document-fixture';
import { showLayoutPane } from '../../helpers/layout-pane';
import { assignLongLabels, longLabelNames } from '../../helpers/long-label-fixture';
import {
  assertCorrectionsBottomSheet,
  assertFieldNameStackedAboveValue,
  assertFieldRegionRenderedWithValue,
  assertLongLabelChipsTruncateWithTooltip,
  assertNoClippedOrOverlappingChips,
  assertNoHorizontalOverflow,
  assertOverflowMissesHeader,
  assertToastMissesSheetActions,
  captureLoadedScreenshot,
  captureViewportScreenshot,
} from '../../helpers/overflow-check';
import {
  listFields,
  replaceFields,
  type RecognizedFieldPayload,
} from '../../helpers/recognized-fields-catalog';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';
import { findReadyLayoutDocument } from '../../helpers/wait-for-layout-ir';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

/** Seeded for this suite: workstream-e config has no globalSetup, so smoke users start with an empty catalog. */
const SEEDED_FIELD_KEY = 'e2e_field_regions_assign';
const SEEDED_FIELD_LABEL = 'E2E Zuweisen';

test.use({ storageState: smokeFixtureStoragePath() });

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: ViewportSpec[] = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

const COLOR_SCHEMES: ('light' | 'dark')[] = ['light', 'dark'];

async function applyGermanLocale(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto('/');
  await applyDocuvateLocale(page, 'de');
}

async function setLabelsTabOpen(page: Page, open: boolean): Promise<void> {
  const labels = page.getByRole('tab', { name: /^Labels/i });
  const selected = (await labels.getAttribute('aria-selected')) === 'true';
  if (open === selected) {
    return;
  }
  if (open) {
    await labels.click({ force: true });
    return;
  }
  await page.getByRole('tab', { name: /^Details/i }).click({ force: true });
}

async function openFieldCorrectionSheet(page: Page): Promise<void> {
  const sheet = page.locator('[data-testid="field-correction-sheet"]');
  if (await sheet.isVisible()) {
    return;
  }
  await setLabelsTabOpen(page, false);
  await showLayoutPane(page, 'panel');
  await page
    .locator('.layout-side-tabs')
    .getByRole('tab', { name: /Übersicht|Overview/i })
    .click({ force: true });
  // Confirmed fields without a region (e.g. Betrag) can sort first; open a row that
  // has a page source chip so the sheet carries "Seite N" for the assertion below.
  const rowWithChip = page
    .locator('.layout-field-row')
    .filter({ has: page.locator('.source-chip') })
    .getByTestId('field-value-row-select')
    .first();
  const row =
    (await rowWithChip.count()) > 0
      ? rowWithChip
      : page.getByTestId('field-value-row-select').first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();
  await expect(page.locator('.layout-workspace')).not.toHaveAttribute('data-selected-field', '');
  await expect(sheet).toBeVisible({ timeout: 15_000 });
}

async function startRectangle(page: Page): Promise<void> {
  const word = page
    .locator('.pdf-page-wrap .textLayer span')
    .filter({
      hasText: /Widget|Alex|Testmann|FIXTURE|Compose/i,
    })
    .first();
  if ((await word.count()) > 0) {
    await expect(word).toBeVisible({ timeout: 60_000 });
    const box = await word.boundingBox();
    expect(box).toBeTruthy();
    if (!box) {
      return;
    }
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 80, box.y + box.height + 24);
    return;
  }
  const canvas = page.locator('.pdf-page-canvas').first();
  await expect(canvas).toBeVisible({ timeout: 180_000 });
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  if (!box) {
    return;
  }
  await page.mouse.move(box.x + box.width * 0.04, box.y + box.height * 0.12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.22);
}

async function finishRectangle(page: Page): Promise<void> {
  await page.mouse.up();
}

async function dismissOverlaySheets(page: Page): Promise<void> {
  const open = page.locator(
    '[data-testid="field-correction-sheet"], [data-testid="label-overflow-sheet"], .label-chip-row-overflow-popover'
  );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if ((await open.count()) === 0) {
      return;
    }
    await page.keyboard.press('Escape');
    await expect(open)
      .toHaveCount(0, { timeout: 5_000 })
      .catch(() => undefined);
  }
}

/**
 * Real-user assign path: focus the field combobox, type a known label, choose the matching option.
 * Relies on a seeded recognized-field catalog entry (see beforeAll) — smoke + workstream-e has none by default.
 */
async function selectExistingFieldInContextBar(page: Page, fieldLabel: string): Promise<void> {
  const bar = page.getByTestId('field-context-bar');
  const accept = bar.getByTestId('field-context-bar-accept');
  await expect(accept).toBeDisabled();
  await expect(accept).toHaveText(/Feld anlegen|Create field/i);

  const combobox = bar.getByRole('combobox', {
    name: /Feld für diese Auswahl|Field for this selection/i,
  });
  await combobox.click();
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  await combobox.fill(fieldLabel);

  const option = page.getByRole('option', { name: fieldLabel, exact: true });
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();

  await expect(accept).toBeEnabled();
  await expect(accept).toHaveText(/Feld zuweisen|Assign field/i);
}

async function confirmAssignedFieldInContextBar(page: Page): Promise<void> {
  const accept = page.getByTestId('field-context-bar-accept');
  await expect(accept).toBeEnabled();
  await expect(accept).toHaveText(/Feld zuweisen|Assign field/i);
  await accept.click();

  // Assigning onto a field that already holds a different value opens overwrite confirm.
  const overwriteDialog = page.getByRole('dialog', {
    name: /Vorhandenes Feld überschreiben|Overwrite existing field/i,
  });
  const overwriteAppeared = await overwriteDialog
    .waitFor({ state: 'visible', timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (overwriteAppeared) {
    await overwriteDialog.getByRole('button', { name: /Überschreiben|Overwrite/i }).click();
  }
}

/** Type a new field name and confirm via the create-option row (auto-submits). */
async function createFieldViaContextBarOption(page: Page, fieldName: string): Promise<void> {
  const bar = page.getByTestId('field-context-bar');
  const accept = bar.getByTestId('field-context-bar-accept');
  await expect(accept).toBeDisabled();
  await expect(accept).toHaveText(/Feld anlegen|Create field/i);

  const combobox = bar.getByRole('combobox', {
    name: /Feld für diese Auswahl|Field for this selection/i,
  });
  await combobox.click();
  await combobox.fill(fieldName);

  const createOption = page.locator('.combobox-create-option').filter({ hasText: fieldName });
  await expect(createOption).toBeVisible({ timeout: 15_000 });
  await createOption.click();
}

test.describe('document field regions', () => {
  test.describe.configure({ mode: 'serial', timeout: 420_000, retries: 0 });

  let layoutDocId: string;
  let ownedLayoutDoc = false;
  const labels = longLabelNames(25);
  const createdTagIds: string[] = [];
  let originalRecognizedFields: RecognizedFieldPayload[] | null = null;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(420_000);
    // Capture first so afterAll can restore even if later steps fail.
    originalRecognizedFields = await listFields(request);
    const alreadySeeded = originalRecognizedFields.some((field) => field.key === SEEDED_FIELD_KEY);
    if (!alreadySeeded) {
      const seed: RecognizedFieldPayload = {
        key: SEEDED_FIELD_KEY,
        label: SEEDED_FIELD_LABEL,
        fieldType: 'text',
        sortOrder: originalRecognizedFields.length,
        extractForAllDocuments: false,
        gateLabelIds: [],
        gateLabelMatch: 'any',
        minLabelConfidence: null,
        confidenceGateEnabled: null,
        showInFilter: false,
      };
      await replaceFields(request, [...originalRecognizedFields, seed]);
    }
    const existing = await findReadyLayoutDocument(request, apiBase, webOrigin);
    if (existing) {
      layoutDocId = existing;
    } else {
      layoutDocId = await uploadLayoutTableDocument(request, apiBase, webOrigin);
      ownedLayoutDoc = true;
    }
    createdTagIds.push(
      ...(await assignLongLabels(request, apiBase, webOrigin, layoutDocId, labels))
    );
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60_000);
    if (originalRecognizedFields !== null) {
      await replaceFields(request, originalRecognizedFields);
    }
    for (const tagId of createdTagIds) {
      await request.delete(`${apiBase}/v1/tags/${tagId}`, {
        headers: { origin: webOrigin },
      });
    }
    if (!layoutDocId || !ownedLayoutDoc) {
      return;
    }
    await request.delete(`${apiBase}/v1/documents/${layoutDocId}`, {
      headers: { origin: webOrigin },
    });
  });

  test('overflow, chips, bottom sheet, rectangle, and source chip', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openLayoutDocumentPage(page, layoutDocId);

    await page
      .locator('.layout-side-tabs')
      .getByRole('tab', { name: /Übersicht|Overview/i })
      .click();
    await expect(page.getByTestId('document-selection-layer')).toHaveAttribute(
      'data-token-count',
      /^(?!0$)\d+$/,
      { timeout: 60_000 }
    );
    await page.getByRole('radio', { name: /Rechteck|Rectangle/i }).click();
    await startRectangle(page);
    await expect(page.getByTestId('document-selection-rect')).toBeVisible({ timeout: 15_000 });
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-before-rectangle.png'
    );
    await finishRectangle(page);

    const bar = page.getByTestId('field-context-bar');
    await expect(bar).toBeVisible({ timeout: 30_000 });
    // Bar starts with no field selected — Accept stays disabled until an existing field is chosen.
    await selectExistingFieldInContextBar(page, SEEDED_FIELD_LABEL);
    await confirmAssignedFieldInContextBar(page);
    await expect(page.getByText(/Korrektur gespeichert|Correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('.source-chip')).toContainText('Seite 1');
    await assertFieldRegionRenderedWithValue(page);
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-after-rectangle.png'
    );
    await captureLoadedScreenshot(
      page.locator('.document-detail-page'),
      testInfo,
      'field-regions-source-chip-seite-1.png'
    );
    await expect(page.locator('[data-testid="field-correction-sheet"]')).toHaveCount(0);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await expect(page.locator('.layout-workspace')).toHaveAttribute(
        'data-correction-sheet-viewport',
        viewport.width < 1024 ? '1' : '0',
        { timeout: 10_000 }
      );
      for (const scheme of COLOR_SCHEMES) {
        await page.emulateMedia({ colorScheme: scheme });
        await setLabelsTabOpen(page, false);
        if (viewport.width < 1024) {
          await openFieldCorrectionSheet(page);
          await assertCorrectionsBottomSheet(page);
          await expect(page.locator('.document-detail-page')).toHaveAttribute(
            'data-correction-sheet-open',
            '1'
          );
          await expect(page.locator('.extracted-fields-section')).toHaveCount(0);
          await expect(page.locator('.field-value-row')).toHaveCount(0);
          await expect(page.locator('.source-chip')).toContainText('Seite 1');
          await assertToastMissesSheetActions(page);
          await assertNoHorizontalOverflow(page);
          if (scheme === 'light') {
            await captureViewportScreenshot(
              page,
              testInfo,
              `field-regions-bottom-sheet-${viewport.name}-${scheme}.png`
            );
          }
          await dismissOverlaySheets(page);
          await expect(page.locator('[data-testid="field-correction-sheet"]')).toHaveCount(0);
        } else {
          await page
            .locator('.layout-side-tabs')
            .getByRole('tab', { name: /Übersicht|Overview/i })
            .click({ force: true });
          await expect(page.locator('.source-chip')).toContainText('Seite 1');
          await assertFieldNameStackedAboveValue(page);
          await assertNoHorizontalOverflow(page);
          if (scheme === 'light' && (viewport.width === 1024 || viewport.width === 1440)) {
            await captureLoadedScreenshot(
              page.locator('.layout-side-fields'),
              testInfo,
              `field-regions-recognized-fields-${viewport.name}-${scheme}.png`
            );
          }
        }

        await setLabelsTabOpen(page, true);
        const more = page.locator('.label-chip-row-overflow-btn, .overflow-chip-more');
        await expect(more).toBeVisible({ timeout: 60_000 });
        await expect(more).toHaveText(/\+\d+/);
        await assertLongLabelChipsTruncateWithTooltip(page);
        await assertNoClippedOrOverlappingChips(page);
        await assertNoHorizontalOverflow(page);
        if (scheme === 'light') {
          await more.click();
          const popover = page.locator(
            '.label-chip-row-overflow-popover, .overflow-chip-popover, [data-testid="label-overflow-sheet"]'
          );
          await expect(popover).toBeVisible();
          await assertOverflowMissesHeader(page);
          await captureViewportScreenshot(
            page,
            testInfo,
            `field-regions-long-labels-${viewport.name}-${scheme}.png`
          );
          await page.keyboard.press('Escape');
          await expect(popover).toHaveCount(0);
        }
      }
    }
  });

  test('create field by text selection', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyGermanLocale(page);
    await openLayoutDocumentPage(page, layoutDocId);
    await page.getByRole('radio', { name: /Text \(T\)/i }).click();
    const word = page.locator('.pdf-page-wrap .textLayer span').first();
    await expect(word).toBeVisible({ timeout: 60_000 });
    await word.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await expect(page.getByTestId('field-context-bar')).toBeVisible({ timeout: 30_000 });
    const fieldName = `e2e_text_sel_${Date.now().toString(36)}`;
    await createFieldViaContextBarOption(page, fieldName);
    await expect(page.getByText(/Korrektur gespeichert|Correction saved/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
