// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test';

import { applyDocuvateLocale } from '../../helpers/docuvate-theme';
import { parseDocumentListBody } from '../../helpers/json-body';
import { assertNoHorizontalOverflow } from '../../helpers/overflow-check';
import {
  isRecord,
  listFields,
  type RecognizedFieldPayload,
  replaceFields,
} from '../../helpers/recognized-fields-catalog';
import { smokeFixtureStoragePath } from '../../helpers/smoke-fixture-auth';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';

const NARROW_VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
] as const;

/** Above the stacked list's virtualization threshold (40) so the scale path is exercised. */
const LABEL_COUNT = 60;
const FIELD_COUNT = 30;
const LABEL_PREFIX = 'Arbeitgeberbescheinigung';
const FIELD_PREFIX = 'Rechnungseingangsdatum Lieferantenrechnung';

test.use({ storageState: smokeFixtureStoragePath() });

/** Random lowercase letters: label-name normalization ignores digits, so hex would collide. */
function randomLetters(length: number): string {
  const hex = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  return Array.from(hex.slice(0, length), (char) =>
    String.fromCharCode(97 + Number.parseInt(char, 16))
  ).join('');
}

async function createTag(request: APIRequestContext, name: string): Promise<string> {
  const res = await request.post(`${apiBase}/v1/tags`, {
    headers: { origin: webOrigin },
    data: { name },
  });
  expect(res.ok(), `create tag: ${String(res.status())} ${await res.text()}`).toBeTruthy();
  const body: unknown = await res.json();
  const id = isRecord(body) && typeof body.id === 'string' ? body.id : '';
  expect(id).not.toBe('');
  return id;
}

async function openGerman(page: Page, route: string): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('docuvate.locale', 'de');
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await applyDocuvateLocale(page, 'de');
}

/** Every element must end inside the viewport: no clipped primary action. */
async function expectWithinViewportWidth(page: Page, locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const width = page.viewportSize()?.width ?? 0;
  expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= width + 0.5).toBeTruthy();
}

/** Labels are shown in full (wrapped), never ellipsized, so similar prefixes stay distinguishable. */
async function expectLabelRowsShowFullNames(page: Page): Promise<number> {
  const rows = page.locator('.labels-vocabulary-card-row');
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  const report = await rows.evaluateAll(
    (elements, prefix) =>
      elements
        .map((row) => {
          const label = row.querySelector('.chip-label');
          if (!(label instanceof HTMLElement) || !(label.textContent ?? '').startsWith(prefix)) {
            return null;
          }
          const rowRect = row.getBoundingClientRect();
          const labelRect = label.getBoundingClientRect();
          return {
            name: label.textContent ?? '',
            clipped: label.scrollWidth > label.clientWidth + 1,
            outside: labelRect.right > rowRect.right + 0.5,
          };
        })
        .filter((entry) => entry !== null),
    LABEL_PREFIX
  );
  expect(report.length).toBeGreaterThan(0);
  expect(report.filter((entry) => entry.clipped || entry.outside)).toEqual([]);
  return report.length;
}

test.describe('labels and recognized fields at scale', () => {
  const runId = randomLetters(8);
  const tagIds: string[] = [];
  let originalFields: RecognizedFieldPayload[] | null = null;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(180_000);
    // Capture the catalog first so afterAll can always restore exactly what was there.
    originalFields = await listFields(request);
    for (let index = 0; index < LABEL_COUNT; index += 1) {
      // Distinct tails keep the names apart from the near-duplicate guard while sharing a long prefix.
      const tail = randomLetters(24);
      tagIds.push(await createTag(request, `${LABEL_PREFIX} ${runId} ${tail}`));
    }
    const added: RecognizedFieldPayload[] = [];
    for (let index = 0; index < FIELD_COUNT; index += 1) {
      added.push({
        key: `scale_${runId}_${String(index)}`,
        label: `${FIELD_PREFIX} ${runId} ${String(index)}`,
        fieldType: 'date',
        sortOrder: 0,
        extractForAllDocuments: false,
        gateLabelIds: [tagIds[index % tagIds.length] ?? ''],
        gateLabelMatch: 'any',
        minLabelConfidence: 0.8,
        confidenceGateEnabled: true,
        showInFilter: false,
      });
    }
    await replaceFields(request, [...(originalFields ?? []), ...added]);
  });

  test.afterAll(async ({ request }) => {
    if (originalFields !== null) {
      await replaceFields(request, originalFields);
    }
    for (const id of tagIds) {
      await request.delete(`${apiBase}/v1/tags/${id}`, { headers: { origin: webOrigin } });
    }
  });

  test('label vocabulary shows full names and reachable actions on small screens', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const viewport of NARROW_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openGerman(page, '/structure/labels');
      const filter = page.getByTestId('labels-vocabulary-filter-picker').locator('input');
      await filter.fill(`${LABEL_PREFIX} ${runId}`);
      const scroll = page.getByTestId('labels-vocabulary-virtual-scroll');
      await expect(scroll).toBeVisible({ timeout: 30_000 });
      await expectLabelRowsShowFullNames(page);
      await expectWithinViewportWidth(
        page,
        page
          .locator('.labels-vocabulary-card-row')
          .first()
          .getByRole('button', { name: 'Bearbeiten' })
      );
      await assertNoHorizontalOverflow(page);

      // The end of a long list is reachable and renders the same way.
      await scroll.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expectLabelRowsShowFullNames(page);
      await expectWithinViewportWidth(
        page,
        page
          .locator('.labels-vocabulary-card-row')
          .last()
          .getByRole('button', { name: 'Bearbeiten' })
      );
    }
  });

  test('recognized fields stack into readable cards on small screens', async ({ page }) => {
    test.setTimeout(120_000);
    for (const viewport of NARROW_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openGerman(page, '/structure/recognized-fields');
      const rows = page.locator('.recognized-fields-table tbody tr', { hasText: runId });
      await expect(rows).toHaveCount(FIELD_COUNT, { timeout: 30_000 });
      const wrap = page.locator('.recognized-fields-table-wrap');
      expect(
        await wrap.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
        'field table must not scroll sideways'
      ).toBeTruthy();

      const report = await rows.evaluateAll((elements) =>
        elements.map((row) => {
          const label = row.querySelector('.recognized-fields-table__primary');
          const rule = row.querySelector('.recognized-fields-table__rule');
          const textNode = label?.firstChild;
          let brokenWords = 0;
          if (label instanceof HTMLElement && textNode instanceof Text) {
            const text = textNode.data;
            let offset = 0;
            for (const word of text.split(' ')) {
              const range = document.createRange();
              range.setStart(textNode, offset);
              range.setEnd(textNode, offset + word.length);
              const lines = new Set(
                Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))
              );
              const wordWidth = range.getBoundingClientRect().width;
              // A word wider than the whole cell may break; anything else must stay on one line.
              if (lines.size > 1 && wordWidth < label.clientWidth) {
                brokenWords += 1;
              }
              offset += word.length + 1;
            }
          }
          return {
            brokenWords,
            ruleClipped: rule instanceof HTMLElement && rule.scrollWidth > rule.clientWidth + 1,
          };
        })
      );
      expect(report.filter((entry) => entry.brokenWords > 0 || entry.ruleClipped)).toEqual([]);

      const lastRow = rows.last();
      await lastRow.scrollIntoViewIfNeeded();
      await expectWithinViewportWidth(page, lastRow.getByRole('button', { name: 'Bearbeiten' }));
      await expectWithinViewportWidth(page, lastRow.getByRole('button', { name: /entfernen/i }));
      await assertNoHorizontalOverflow(page);
    }
  });

  test('document label hint only describes controls that exist', async ({ page, request }) => {
    test.setTimeout(90_000);
    const res = await request.get(`${apiBase}/v1/documents?limit=1`, {
      headers: { origin: webOrigin },
    });
    expect(res.ok()).toBeTruthy();
    const [doc] = parseDocumentListBody(await res.json());
    expect(doc, 'fixture user needs at least one document').toBeDefined();
    await page.setViewportSize(NARROW_VIEWPORTS[1]);
    await openGerman(page, `/documents/${doc?.id ?? ''}`);
    await page.getByRole('tab', { name: /^Labels/ }).click();
    const hint = page.locator('#label-add-hint');
    await expect(hint).toBeVisible({ timeout: 30_000 });
    await expect(hint).toContainText('aus der Liste wählen');
    // The panel has no separate submit button, so the hint must not point to one.
    await expect(hint).not.toContainText('„Hinzufügen“');
    await expect(page.getByRole('combobox', { name: /Label/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
