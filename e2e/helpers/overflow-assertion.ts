// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface OverflowViolation {
  selector: string;
  reason: string;
}

const MAX_NODES = 4000;

function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function elementDescriptor(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const className =
    typeof el.className === 'string' && el.className.trim().length > 0
      ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
      : '';
  const text = (el.textContent ?? '').trim().slice(0, 40);
  return `${tag}${id}${className}${text ? `:"${text}"` : ''}`;
}

function hasHorizontalEllipsisHandling(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  const overflowX = style.overflowX;
  const allowsScroll = overflowX === 'auto' || overflowX === 'scroll';
  if (allowsScroll) {
    return true;
  }
  if (
    style.textOverflow === 'ellipsis' &&
    (overflowX === 'hidden' || overflowX === 'clip')
  ) {
    return true;
  }
  return false;
}

function ancestorClipsOverflowX(el: HTMLElement, stopAt: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent && parent !== stopAt) {
    const ox = getComputedStyle(parent).overflowX;
    if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function elementOrAncestorEllipsis(el: HTMLElement, stopAt: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node && node !== stopAt) {
    if (hasHorizontalEllipsisHandling(node)) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Flags descendants that paint past a clipping ancestor without ellipsis/scroll handling.
 * Intended for layout smoke tests at narrow widths.
 */
export function collectUnhandledHorizontalOverflow(
  root: HTMLElement,
  tolerancePx = 1
): OverflowViolation[] {
  const violations: OverflowViolation[] = [];
  const nodes = root.querySelectorAll('*');
  const limit = Math.min(nodes.length, MAX_NODES);

  for (let i = 0; i < limit; i += 1) {
    const node = nodes.item(i);
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!isElementVisible(node)) {
      continue;
    }

    const clipParent = ancestorClipsOverflowX(node, root);
    if (!clipParent) {
      continue;
    }

    const nodeRect = node.getBoundingClientRect();
    const clipRect = clipParent.getBoundingClientRect();
    const spillsRight = nodeRect.right > clipRect.right + tolerancePx;
    const spillsLeft = nodeRect.left < clipRect.left - tolerancePx;
    if (!spillsRight && !spillsLeft) {
      continue;
    }

    if (elementOrAncestorEllipsis(node, clipParent)) {
      continue;
    }

    if (node.scrollWidth > node.clientWidth + tolerancePx && hasHorizontalEllipsisHandling(node)) {
      continue;
    }

    violations.push({
      selector: elementDescriptor(node),
      reason: spillsRight
        ? `extends ${(nodeRect.right - clipRect.right).toFixed(1)}px past clipping ancestor`
        : `extends ${(clipRect.left - nodeRect.left).toFixed(1)}px past clipping ancestor (left)`,
    });
    if (violations.length >= 25) {
      break;
    }
  }

  return violations;
}
