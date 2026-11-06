// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page, test } from '@playwright/test';

import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

async function openPicker(page: Page) {
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  await page
    .locator('.layout-side-tabs')
    .getByRole('tab', { name: /Tabellen/ })
    .click();
  const card = page.getByTestId('corrected-table-card').first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Layout für Tabelle 1 wählen' }).click();
  return page.getByTestId('table-layout-picker');
}

test.describe('table layout picker', () => {
  test('a financial layout sets results footer, merged labels and accounting lines in one correction', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);
    const picker = await openPicker(page);
    await picker.getByText('Finanzlayout').click();
    await picker.getByText('Struktur anpassen').click();
    await picker
      .getByText('Ergebniszeilen')
      .locator('xpath=ancestor::fieldset[1]')
      .getByText('3', { exact: true })
      .click();
    await picker.getByRole('button', { name: 'Layout übernehmen' }).click();

    await expect.poll(() => log.tableCorrections.length).toBe(1);
    expect(log.tableCorrections[0]).toMatchObject({
      op: 'set_headers',
      tableType: 'line_items',
      headerRows: 1,
      footerRows: 3,
      headerCols: 0,
      trailingHeaderCols: 0,
      merges: [
        { row0: 4, col0: 0, rowSpan: 1, colSpan: 4 },
        { row0: 5, col0: 0, rowSpan: 1, colSpan: 4 },
        { row0: 6, col0: 0, rowSpan: 1, colSpan: 4 },
      ],
    });
    await expect(picker).toHaveCount(0);
    await expect(page.getByText('Tabellenlayout übernommen')).toBeVisible();
    const total = page
      .getByTestId('corrected-table-card')
      .first()
      .getByLabel('Zelle Zeile 7 Spalte 1', { exact: true });
    await expect(total).toHaveValue('Gesamtbetrag');
    const cell = total.locator('xpath=ancestor::td[1]');
    await expect(cell).toHaveAttribute('colspan', '4');
    await expect(cell).toHaveAttribute('data-bb', 'double');
    await expect(cell.locator('xpath=ancestor::tfoot[1]')).toHaveCount(1);
  });

  test('index position, borderless ruling and zebra rows compose independently', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);
    const picker = await openPicker(page);
    await picker.getByText('Matrix', { exact: true }).click();
    await picker.getByText('Struktur anpassen').click();
    await picker.getByText('Beidseitig').click();
    await picker.getByText('Ohne', { exact: true }).click();
    await picker.getByText('Zebrastreifen').click();
    await picker.getByRole('button', { name: 'Layout übernehmen' }).click();

    await expect.poll(() => log.tableCorrections.length).toBe(1);
    expect(log.tableCorrections[0]).toMatchObject({
      headerCols: 1,
      trailingHeaderCols: 1,
      banded: true,
    });
    const card = page.getByTestId('corrected-table-card').first();
    await expect(card.locator('table.layout-data-table--banded')).toHaveCount(1);
    await expect(card.locator('th[scope="row"]').first()).toBeVisible();
  });
});
