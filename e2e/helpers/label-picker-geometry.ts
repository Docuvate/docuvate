// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect } from '@playwright/test';

export const LABEL_PICKER_POPOVER_INSET_PX = 12;
export const MIN_VISIBLE_CHIP_TEXT_CHARS = 6;

export async function assertTagFilterPopoverChipInset(
  page: import('@playwright/test').Page
): Promise<void> {
  const issue = await page.evaluate((insetPx) => {
    const popover = document.querySelector('[data-testid="library-filter-tag-combobox-popover"]');
    if (!(popover instanceof HTMLElement)) {
      return 'missing-popover';
    }
    const popRect = popover.getBoundingClientRect();
    const maxRight = popRect.right - insetPx;
    const chips = popover.querySelectorAll('.label-picker-combobox-option .chip');
    for (let i = 0; i < chips.length; i += 1) {
      const chip = chips.item(i);
      if (!(chip instanceof HTMLElement)) {
        continue;
      }
      if (chip.getBoundingClientRect().right > maxRight + 0.5) {
        return 'chip-past-popover-edge';
      }
    }
    const sections = popover.querySelectorAll('.label-picker-combobox-section');
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections.item(i);
      const text = section?.textContent?.trim() ?? '';
      if (text.length === 1) {
        return `stray-letter-header:${text}`;
      }
    }
    return null;
  }, LABEL_PICKER_POPOVER_INSET_PX);
  expect(issue).toBeNull();
}

export async function assertDocumentRowChipsMinReadable(
  page: import('@playwright/test').Page
): Promise<void> {
  const issue = await page.evaluate((minChars) => {
    const probe = document.querySelector('[data-measure-six-chars] .chip-label');
    const minLabelWidth =
      probe instanceof HTMLElement ? probe.getBoundingClientRect().width : minChars * 7;

    const labels = document.querySelectorAll(
      '.document-labels-cell-row .label-chip-row-visible .label-chip-row-chip .chip-label'
    );
    for (let i = 0; i < labels.length; i += 1) {
      const labelEl = labels.item(i);
      if (!(labelEl instanceof HTMLElement)) {
        continue;
      }
      const text = labelEl.textContent?.trim() ?? '';
      if (text.length === 0) {
        continue;
      }
      const truncated = labelEl.scrollWidth > labelEl.clientWidth + 1;
      const bare = text.replace(/\u2026/g, '').replace(/\.+$/, '');
      if (!truncated) {
        continue;
      }
      if (bare.length > 0 && bare.length < minChars) {
        return `short-visible-text:${text}`;
      }
      if (labelEl.clientWidth + 0.5 < minLabelWidth) {
        return `narrow-truncated:${text}`;
      }
    }
    return null;
  }, MIN_VISIBLE_CHIP_TEXT_CHARS);

  expect(issue).toBeNull();
}
