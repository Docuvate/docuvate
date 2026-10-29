// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Self-contained browser scan entrypoints for Playwright `locator.evaluate(...)`.
 * Each export must not reference module-level bindings or sibling functions — Playwright
 * only serializes the exported function body into the page context.
 */

export interface FilesystemLayoutViolation {
  target: string;
  reason: string;
}

/** Breadcrumb text nodes must fit their box (ellipsis), not spill horizontally. */
export function collectBreadcrumbTextOverflowViolations(root: HTMLElement): FilesystemLayoutViolation[] {
  const tolerancePx = 1;
  const violations: FilesystemLayoutViolation[] = [];
  const nav = root.querySelector('.dateisystem-breadcrumb');
  if (!(nav instanceof HTMLElement)) {
    return [{ target: '.dateisystem-breadcrumb', reason: 'missing breadcrumb nav' }];
  }

  const textNodes = nav.querySelectorAll('.breadcrumb-link, .breadcrumb-current');
  for (let i = 0; i < textNodes.length; i += 1) {
    const el = textNodes.item(i);
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    if (el.scrollWidth > el.clientWidth + tolerancePx) {
      violations.push({
        target: el.className,
        reason: `breadcrumb text spills (${String(el.scrollWidth)} > ${String(el.clientWidth)})`,
      });
    }
  }

  const navRect = nav.getBoundingClientRect();
  const heading = nav.closest('.dateisystem-content-heading');
  if (heading instanceof HTMLElement) {
    const headingRect = heading.getBoundingClientRect();
    if (navRect.right > headingRect.right + tolerancePx) {
      violations.push({
        target: 'dateisystem-breadcrumb',
        reason: `breadcrumb nav extends past heading (${(navRect.right - headingRect.right).toFixed(1)}px)`,
      });
    }
  }

  return violations;
}

/** Folder tree labels stay on one line (ellipsis); no mid-word line breaks. */
export function collectFilesystemTreeLabelViolations(root: HTMLElement): FilesystemLayoutViolation[] {
  const violations: FilesystemLayoutViolation[] = [];
  const labels = root.querySelectorAll('.dateisystem-tree-link .sidebar-tree-name');
  for (let i = 0; i < labels.length; i += 1) {
    const el = labels.item(i);
    if (!(el instanceof HTMLElement)) {
      continue;
    }
    const style = getComputedStyle(el);
    const whiteSpace = style.whiteSpace;
    if (whiteSpace !== 'nowrap' && whiteSpace !== 'pre' && whiteSpace !== 'pre nowrap') {
      violations.push({
        target: (el.textContent ?? '').slice(0, 40),
        reason: `tree label white-space is ${whiteSpace} (expected nowrap)`,
      });
      continue;
    }
    const lineHeight = Number.parseFloat(style.lineHeight) || 18;
    if (el.scrollHeight > lineHeight * 1.35) {
      violations.push({
        target: (el.textContent ?? '').slice(0, 40),
        reason: `tree label wraps to multiple lines (height ${String(el.scrollHeight)})`,
      });
    }
  }
  return violations;
}
