// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page, test } from '@playwright/test';

import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

async function openTools(page: Page) {
  await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
  await page
    .locator('.layout-side-tabs')
    .getByRole('tab', { name: /Tabellen/ })
    .click();
  const card = page.getByTestId('corrected-table-card').first();
  await expect(card).toBeVisible();
  // The table is shown first; its structure tools sit directly on the card, no picker to open.
  return card.getByTestId('table-structure-tools');
}

test.describe('table structure tools', () => {
  test('a financial layout sets results footer, merged labels and accounting lines in one correction', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);
    const tools = await openTools(page);
    await tools.getByRole('combobox', { name: 'Vorlage' }).selectOption('financial');
    await tools
      .getByRole('group', { name: 'Ergebniszeilen' })
      .getByRole('button', { name: 'Mehr' })
      .click();
    await expect(tools.getByRole('spinbutton', { name: 'Ergebniszeilen' })).toHaveValue('3');
    await tools.getByRole('button', { name: 'Übernehmen' }).click();

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
    await expect(tools.getByRole('button', { name: 'Übernehmen' })).toHaveCount(0);
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
    const tools = await openTools(page);
    await tools.getByRole('combobox', { name: 'Vorlage' }).selectOption('matrix');
    await tools.getByRole('button', { name: 'Darstellung' }).click();
    await tools.getByRole('combobox', { name: 'Indexspalte' }).selectOption('both');
    await tools.getByRole('combobox', { name: 'Linien' }).selectOption('none');
    await tools.getByRole('checkbox', { name: 'Zebrastreifen' }).check();
    await tools.getByRole('button', { name: 'Übernehmen' }).click();

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

  test('a row is re-labelled and cells are merged directly on the table', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);
    const tools = await openTools(page);
    const card = page.getByTestId('corrected-table-card').first();
    await card.getByRole('combobox', { name: 'Zeilenart von Zeile 3' }).selectOption('section');
    await card.getByLabel('Zelle Zeile 3 Spalte 1', { exact: true }).click();
    await card
      .getByLabel('Zelle Zeile 3 Spalte 2', { exact: true })
      .click({ modifiers: ['Shift'] });
    await tools.getByRole('button', { name: 'Zellen verbinden' }).click();
    await expect(
      card.getByLabel('Zelle Zeile 3 Spalte 1', { exact: true }).locator('xpath=ancestor::td[1]')
    ).toHaveAttribute('colspan', '2');
    await tools.getByRole('button', { name: 'Übernehmen' }).click();
    await expect.poll(() => log.tableCorrections.length).toBe(1);
    expect(log.tableCorrections[0]).toMatchObject({
      rowRoles: [{ row: 2, role: 'section' }],
      merges: expect.arrayContaining([{ row0: 2, col0: 0, rowSpan: 1, colSpan: 2 }]),
    });
  });
});
