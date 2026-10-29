// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface TouchTargetViolation {
  descriptor: string;
  width: number;
  height: number;
}

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  'summary',
].join(', ');

const MAX_SCAN = 500;

function isElementVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
    return false;
  }
  if (el.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isDisabled(el: HTMLElement): boolean {
  if (el.matches(':disabled')) {
    return true;
  }
  return el.getAttribute('aria-disabled') === 'true';
}

function elementDescriptor(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const role = el.getAttribute('role');
  const rolePart = role ? `[role=${role}]` : '';
  const name =
    el.getAttribute('aria-label') ??
    (el.textContent ?? '').trim().slice(0, 48);
  const className =
    typeof el.className === 'string' && el.className.trim().length > 0
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
  return `${tag}${id}${className}${rolePart}${name ? `:"${name}"` : ''}`;
}

/** Map a control to the element whose box should meet the minimum touch size. */
export function resolveTouchTargetElement(el: HTMLElement): HTMLElement {
  if (el.matches('input[type="checkbox"], input[type="radio"]')) {
    const label = el.closest('label');
    if (label instanceof HTMLElement) {
      return label;
    }
  }
  const hitParent = el.closest('.dv-touch-hit-expand, .library-check-touch');
  if (hitParent instanceof HTMLElement) {
    return hitParent;
  }
  if (el.classList.contains('dv-touch-hit-expand')) {
    return el;
  }
  return el;
}

function hiddenByAncestor(el: HTMLElement, root: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return true;
    }
    if (node.getAttribute('aria-hidden') === 'true') {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

/**
 * Scan visible interactive elements under `root` and report those below `minPx` (after resolving hit-area wrappers).
 */
export function collectUndersizedTouchTargets(
  root: HTMLElement,
  minPx: number,
  tolerancePx = 1
): TouchTargetViolation[] {
  const candidates = root.querySelectorAll(INTERACTIVE_SELECTOR);
  const measured = new Set<HTMLElement>();
  const violations: TouchTargetViolation[] = [];
  const limit = Math.min(candidates.length, MAX_SCAN);

  for (let i = 0; i < limit; i += 1) {
    const node = candidates.item(i);
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!root.contains(node)) {
      continue;
    }
    if (hiddenByAncestor(node, root)) {
      continue;
    }
    if (!isElementVisible(node) || isDisabled(node)) {
      continue;
    }

    const target = resolveTouchTargetElement(node);
    if (!isElementVisible(target) || measured.has(target)) {
      continue;
    }
    measured.add(target);

    const rect = target.getBoundingClientRect();
    if (rect.width < minPx - tolerancePx || rect.height < minPx - tolerancePx) {
      violations.push({
        descriptor: elementDescriptor(target),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      });
      if (violations.length >= 30) {
        break;
      }
    }
  }

  return violations;
}

