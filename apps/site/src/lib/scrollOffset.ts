// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Pixel offset for in-page anchors (sticky site header + breathing room). */
function parseCssLengthPx(raw: string, fallbackPx: number): number {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallbackPx;
  return raw.endsWith('rem') ? n * 16 : n;
}

export function getDocsScrollOffsetPx(): number {
  const headerRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--site-header-height')
    .trim();
  const headerPx = parseCssLengthPx(headerRaw, 4.25 * 16);
  const mobileBar = document.querySelector('.docs-toc-mobile-bar');
  let mobileBarPx = 0;
  if (mobileBar instanceof HTMLElement) {
    const style = getComputedStyle(mobileBar);
    if (style.display !== 'none') {
      mobileBarPx = mobileBar.getBoundingClientRect().height;
    }
  }
  return headerPx + mobileBarPx + 16;
}
