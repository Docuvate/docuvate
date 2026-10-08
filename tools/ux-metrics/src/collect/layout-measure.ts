import type { LayoutLandmarks, LayoutPageSnapshot } from '../metrics/types.js';

/** Runs in the browser via page.evaluate (single function, no nested helpers). */
export function measurePageLayout(args: {
  pathname: string;
  pageTitle: string;
  scope: 'customer' | 'dev';
}): LayoutPageSnapshot {
  const pathname = args.pathname;
  const pageTitle = args.pageTitle;
  const scope = args.scope;

  const pageEl = document.querySelector('[data-ux="page"]');
  const titleEl = document.querySelector('[data-ux="page-title"]');
  const primaryEl = document.querySelector('[data-ux="primary-action"]');

  const landmarks: LayoutLandmarks = {
    page: pageEl !== null,
    pageTitle: titleEl !== null,
    primaryAction: primaryEl !== null,
  };

  const pageRect =
    pageEl instanceof HTMLElement ? pageEl.getBoundingClientRect() : null;
  const titleRect =
    titleEl instanceof HTMLElement ? titleEl.getBoundingClientRect() : null;
  const primaryRect =
    primaryEl instanceof HTMLElement ? primaryEl.getBoundingClientRect() : null;

  const pageOk =
    pageRect && (pageRect.width > 0 || pageRect.height > 0) ? pageRect : null;
  const titleOk =
    titleRect && (titleRect.width > 0 || titleRect.height > 0) ? titleRect : null;
  const primaryOk =
    primaryRect && (primaryRect.width > 0 || primaryRect.height > 0) ? primaryRect : null;

  const styles = pageEl instanceof HTMLElement ? getComputedStyle(pageEl) : null;
  const titleStyles = titleEl instanceof HTMLElement ? getComputedStyle(titleEl) : null;

  let cardNestingDepth: number | null = null;
  if (pageEl instanceof HTMLElement) {
    let depthMax = 0;
    const cards = pageEl.querySelectorAll('.card');
    for (const card of cards) {
      let depth = 0;
      let node: Element | null = card;
      while (node && node !== pageEl) {
        if (node.classList.contains('card')) {
          depth += 1;
        }
        node = node.parentElement;
      }
      depthMax = Math.max(depthMax, depth);
    }
    cardNestingDepth = depthMax;
  }

  let gutterWidthPx: number | null = null;
  const libraryLayout = pageEl?.querySelector('.library-layout');
  if (libraryLayout) {
    const children = [...libraryLayout.children].filter(
      (c) => c instanceof HTMLElement && c.offsetWidth > 0
    ) as HTMLElement[];
    if (children.length >= 2) {
      const a = children[0]!.getBoundingClientRect();
      const b = children[1]!.getBoundingClientRect();
      gutterWidthPx = Math.round(Math.max(0, b.left - a.right));
    }
  }

  let containerMaxWidth: number | null = null;
  if (styles && pageOk) {
    if (styles.maxWidth && styles.maxWidth !== 'none') {
      containerMaxWidth = Math.round(parseFloat(styles.maxWidth));
    } else {
      containerMaxWidth = Math.round(pageOk.width);
    }
  }

  return {
    path: pathname,
    title: pageTitle,
    scope,
    landmarks,
    containerLeft: pageOk ? Math.round(pageOk.left) : null,
    containerMaxWidth,
    containerPaddingTop:
      styles && pageOk ? Math.round(parseFloat(styles.paddingTop) || 0) : null,
    titleY: titleOk ? Math.round(titleOk.top) : null,
    titleFontSizePx: titleStyles ? Math.round(parseFloat(titleStyles.fontSize) || 0) : null,
    primaryActionX: primaryOk ? Math.round(primaryOk.left) : null,
    primaryActionY: primaryOk ? Math.round(primaryOk.top) : null,
    cardNestingDepth,
    gutterWidthPx,
  };
}
