// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { expect, type Page } from '@playwright/test';

/** Matches the web app's pane-tabs breakpoint (viewer and side panel share the screen below it). */
export const LAYOUT_PANE_TABS_MAX_WIDTH = 767;

/** On small screens, switch the document workspace to the viewer or the fields panel; no-op on wide screens. */
export async function showLayoutPane(page: Page, pane: 'document' | 'panel'): Promise<void> {
  const width = page.viewportSize()?.width ?? Number.POSITIVE_INFINITY;
  if (width > LAYOUT_PANE_TABS_MAX_WIDTH) {
    return;
  }
  const tabs = page.locator('.layout-pane-tabs');
  await expect(tabs).toBeVisible({ timeout: 15_000 });
  await tabs
    .getByRole('radio', {
      name: pane === 'document' ? /^(Dokument|Document)$/ : /^(Felder|Fields)$/,
    })
    .click();
  await expect(page.locator('.layout-workspace')).toHaveAttribute('data-mobile-pane', pane);
}
