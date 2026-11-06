// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, test } from '@playwright/test';

import { installStructuringMocks, LAYOUT_DOCUMENT_ID } from './structuringMocks';

test.describe('table layout picker', () => {
  test('a named layout sets header, table type and merged totals rows in one correction', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const log = await installStructuringMocks(page);
    await page.goto(`/documents/${LAYOUT_DOCUMENT_ID}`);
    await page
      .locator('.layout-side-tabs')
      .getByRole('tab', { name: /Tabellen/ })
      .click();
    const card = page.getByTestId('corrected-table-card').first();
    await expect(card).toBeVisible();

    await card.getByRole('button', { name: 'Layout für Tabelle 1 wählen' }).click();
    const picker = page.getByTestId('table-layout-picker');
    await picker.getByText('Positionen mit Summe').click();
    await picker.getByRole('button', { name: 'Layout übernehmen' }).click();

    await expect.poll(() => log.tableCorrections.length).toBe(1);
    expect(log.tableCorrections[0]).toMatchObject({
      op: 'set_headers',
      tableType: 'line_items',
      headerRows: 1,
      headerCols: 0,
      merges: [{ row0: 6, col0: 0, rowSpan: 1, colSpan: 4 }],
    });
    await expect(picker).toHaveCount(0);
    await expect(page.getByText('Tabellenlayout übernommen')).toBeVisible();
    const total = page
      .getByTestId('corrected-table-card')
      .first()
      .getByLabel('Zelle Zeile 7 Spalte 1', { exact: true });
    await expect(total).toHaveValue('Gesamtbetrag');
    await expect(total.locator('xpath=ancestor::td[1]')).toHaveAttribute('colspan', '4');
  });
});
