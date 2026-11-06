// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page, test } from '@playwright/test';

import { installStructuringMocks, type StructuringMockLog } from './structuringMocks';

function lastWrite(log: StructuringMockLog, documentId: string) {
  return log.fieldWrites.filter((write) => write.documentId === documentId).at(-1)?.fields ?? [];
}

function fieldIn(log: StructuringMockLog, documentId: string, key: string) {
  return lastWrite(log, documentId).find((field) => field.key === key);
}

async function focusedFieldKey(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const row = document.activeElement?.closest('.review-workbench-row');
    return row?.getAttribute('data-field-key') ?? null;
  });
}

test.describe('rapid review workbench', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('keyboard only: correct the uncertain value, accept the rest, go to the next document', async ({
    page,
  }) => {
    const log = await installStructuringMocks(page);
    await page.goto('/documents/synthetic-doc-0001?review=1');

    // Opens focused on the least confident value (64 %), no click needed.
    await expect.poll(() => focusedFieldKey(page)).toBe('total_amount');
    await expect(page.locator('.review-workbench-keys')).toContainText('Enter übernehmen');

    // E edits in place, Enter saves (a correction is a confirmation of the new value).
    await page.keyboard.press('e');
    const editor = page.getByRole('textbox', { name: 'Neuer Wert für Betrag' });
    await expect(editor).toBeFocused();
    await editor.fill('48,20 EUR');
    await page.keyboard.press('Enter');
    await expect
      .poll(() => fieldIn(log, 'synthetic-doc-0001', 'total_amount'))
      .toMatchObject({ value: '48,20 EUR', userConfirmed: true });

    // Focus lands on the next open value; Enter accepts it.
    await expect.poll(() => focusedFieldKey(page)).not.toBe('total_amount');
    await page.keyboard.press('Enter');
    await expect.poll(() => focusedFieldKey(page)).not.toBeNull();
    await page.keyboard.press('Enter');
    await expect
      .poll(() =>
        lastWrite(log, 'synthetic-doc-0001').every((field) => field.userConfirmed === true)
      )
      .toBe(true);

    // N opens the next queued document, again focused for keyboard review.
    await page.locator('.review-workbench-row-main').first().focus();
    await page.keyboard.press('n');
    await expect(page).toHaveURL(/\/documents\/synthetic-doc-0002\?review=1$/);
    await expect.poll(() => focusedFieldKey(page)).toBe('total_amount');
  });

  test('bulk accept takes only values with high model confidence', async ({ page }) => {
    const log = await installStructuringMocks(page);
    await page.goto('/documents/synthetic-doc-0002');
    await page.getByRole('button', { name: '2 sichere Werte übernehmen' }).click();
    await expect
      .poll(() => fieldIn(log, 'synthetic-doc-0002', 'invoice_number')?.userConfirmed)
      .toBe(true);
    expect(fieldIn(log, 'synthetic-doc-0002', 'date')?.userConfirmed).toBe(true);
    // The 64 % value stays open for a person to check.
    expect(fieldIn(log, 'synthetic-doc-0002', 'total_amount')?.userConfirmed).not.toBe(true);
    await expect(page.locator('.review-workbench-count')).toContainText('offen');
  });

  test('a value can move to the right field; overwriting a confirmed value asks first', async ({
    page,
  }) => {
    const log = await installStructuringMocks(page);
    await page.goto('/documents/synthetic-doc-0003?review=1');
    await expect.poll(() => focusedFieldKey(page)).toBe('total_amount');

    // F: "value right, field wrong".
    await page.keyboard.press('f');
    await page.getByRole('button', { name: 'Anderes Feld für den Wert von Betrag' }).click();
    await page.getByRole('option', { name: 'Nettobetrag' }).click();
    await expect
      .poll(() => fieldIn(log, 'synthetic-doc-0003', 'net_amount'))
      .toMatchObject({ value: '84,20 EUR', userConfirmed: true });
    expect(fieldIn(log, 'synthetic-doc-0003', 'total_amount')).toBeUndefined();

    // Confirm the date, then try to move another value onto it.
    const dateRow = page.locator('.review-workbench-row[data-field-key="date"]');
    await dateRow.getByRole('button', { name: 'Datum übernehmen' }).click();
    await expect.poll(() => fieldIn(log, 'synthetic-doc-0003', 'date')?.userConfirmed).toBe(true);
    const writes = log.fieldWrites.length;
    const invoiceRow = page.locator('.review-workbench-row[data-field-key="invoice_number"]');
    await invoiceRow
      .getByRole('button', { name: 'Rechnungsnummer: Wert einem anderen Feld zuordnen' })
      .click();
    await page.getByRole('button', { name: 'Anderes Feld für den Wert von Rechnungsnummer' }).click();
    await page.getByRole('option', { name: 'Datum' }).click();
    await expect(invoiceRow.getByRole('alert')).toContainText('bestätigten Wert');
    expect(log.fieldWrites.length).toBe(writes);
    await invoiceRow.getByRole('button', { name: 'Abbrechen' }).click();
    expect(log.fieldWrites.length).toBe(writes);
  });
});
