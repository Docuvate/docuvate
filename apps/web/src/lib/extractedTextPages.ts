// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

interface PagedItem {
  page: number;
}

/** Sorted, de-duplicated page numbers from every source that can carry page text. */
export function extractedTextPageNumbers(...sources: readonly (readonly PagedItem[])[]): number[] {
  const pages = new Set<number>();
  for (const source of sources) {
    for (const item of source) {
      if (Number.isInteger(item.page) && item.page >= 1) {
        pages.add(item.page);
      }
    }
  }
  return [...pages].sort((a, b) => a - b);
}

/**
 * Pages the text pane renders. Page-synced multi-page views show only the active page;
 * when the active page is unknown to the text source, every page is shown so the pane is
 * never empty while text exists.
 */
export function extractedTextDisplayPages(
  pageNumbers: readonly number[],
  activePage: number,
  pageSynced: boolean
): number[] {
  if (pageSynced && pageNumbers.length > 1 && pageNumbers.includes(activePage)) {
    return [activePage];
  }
  return [...pageNumbers];
}
