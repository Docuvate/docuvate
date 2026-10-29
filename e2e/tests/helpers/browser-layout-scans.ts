// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Self-contained browser scan entrypoints for Playwright `locator.evaluate(...)`.
 * Each export must not reference module-level bindings or sibling functions — Playwright
 * only serializes the exported function body into the page context.
 */

export interface TouchTargetViolation {
  descriptor: string;
  width: number;
  height: number;
}

export interface OverflowViolation {
  selector: string;
  reason: string;
}

export function collectUndersizedTouchTargetsInPage(root: HTMLElement): TouchTargetViolation[] {
  const interactiveSelector = [
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
  const minPx = 44;
  const tolerancePx = 1;
  const maxScan = 500;
  const violations: TouchTargetViolation[] = [];
  const measured = new Set<HTMLElement>();
  const candidates = root.querySelectorAll(interactiveSelector);
  const limit = Math.min(candidates.length, maxScan);

  for (let i = 0; i < limit; i += 1) {
    const node = candidates.item(i);
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!root.contains(node)) {
      continue;
    }

    let hidden = false;
    let ancestor: HTMLElement | null = node;
    while (ancestor && ancestor !== root) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (ancestorStyle.display === 'none' || ancestorStyle.visibility === 'hidden') {
        hidden = true;
        break;
      }
      if (ancestor.getAttribute('aria-hidden') === 'true') {
        hidden = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    if (hidden) {
      continue;
    }

    const nodeStyle = getComputedStyle(node);
    if (
      nodeStyle.display === 'none' ||
      nodeStyle.visibility === 'hidden' ||
      nodeStyle.pointerEvents === 'none' ||
      node.getAttribute('aria-hidden') === 'true'
    ) {
      continue;
    }
    const nodeRectProbe = node.getBoundingClientRect();
    if (nodeRectProbe.width <= 0 || nodeRectProbe.height <= 0) {
      continue;
    }
    if (node.matches(':disabled') || node.getAttribute('aria-disabled') === 'true') {
      continue;
    }
    if (node.matches('input.sr-only, .sr-only')) {
      continue;
    }
    if (node.closest('.sr-only')) {
      continue;
    }

    let target: HTMLElement = node;
    if (node.matches('input[type="checkbox"], input[type="radio"]')) {
      const label = node.closest('label');
      if (label instanceof HTMLElement) {
        target = label;
      }
    } else {
      const hitParent = node.closest('.dv-touch-hit-expand, .library-check-touch, .dv-touch-hit-expand--block');
      if (hitParent instanceof HTMLElement) {
        target = hitParent;
      }
    }

    const targetStyle = getComputedStyle(target);
    if (
      targetStyle.display === 'none' ||
      targetStyle.visibility === 'hidden' ||
      target.getAttribute('aria-hidden') === 'true'
    ) {
      continue;
    }
    const targetRectProbe = target.getBoundingClientRect();
    if (targetRectProbe.width <= 0 || targetRectProbe.height <= 0) {
      continue;
    }
    if (measured.has(target)) {
      continue;
    }
    measured.add(target);

    const rect = target.getBoundingClientRect();
    if (rect.width < minPx - tolerancePx || rect.height < minPx - tolerancePx) {
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const role = target.getAttribute('role');
      const rolePart = role ? `[role=${role}]` : '';
      const name =
        target.getAttribute('aria-label') ?? (target.textContent ?? '').trim().slice(0, 48);
      const className =
        typeof target.className === 'string' && target.className.trim().length > 0
          ? `.${target.className.trim().split(/\s+/).slice(0, 2).join('.')}`
          : '';
      violations.push({
        descriptor: `${tag}${id}${className}${rolePart}${name ? `:"${name}"` : ''}`,
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

export function collectUnhandledHorizontalOverflowInPage(root: HTMLElement): OverflowViolation[] {
  const maxNodes = 4000;
  const tolerancePx = 1;
  const violations: OverflowViolation[] = [];
  const nodes = root.querySelectorAll('*');
  const limit = Math.min(nodes.length, maxNodes);

  for (let i = 0; i < limit; i += 1) {
    const node = nodes.item(i);
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const nodeStyle = getComputedStyle(node);
    if (nodeStyle.display === 'none' || nodeStyle.visibility === 'hidden') {
      continue;
    }
    const nodeRectProbe = node.getBoundingClientRect();
    if (nodeRectProbe.width <= 0 && nodeRectProbe.height <= 0) {
      continue;
    }

    let clipParent: HTMLElement | null = null;
    let parent = node.parentElement;
    while (parent && parent !== root) {
      const ox = getComputedStyle(parent).overflowX;
      if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') {
        clipParent = parent;
        break;
      }
      parent = parent.parentElement;
    }
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

    let hasEllipsis = false;
    let ellNode: HTMLElement | null = node;
    while (ellNode && ellNode !== clipParent) {
      const style = getComputedStyle(ellNode);
      const overflowX = style.overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
        hasEllipsis = true;
        break;
      }
      if (
        style.textOverflow === 'ellipsis' &&
        (overflowX === 'hidden' || overflowX === 'clip')
      ) {
        hasEllipsis = true;
        break;
      }
      ellNode = ellNode.parentElement;
    }
    if (hasEllipsis) {
      continue;
    }

    const selfStyle = getComputedStyle(node);
    if (
      node.scrollWidth > node.clientWidth + tolerancePx &&
      selfStyle.textOverflow === 'ellipsis' &&
      (selfStyle.overflowX === 'hidden' || selfStyle.overflowX === 'clip')
    ) {
      continue;
    }

    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : '';
    const className =
      typeof node.className === 'string' && node.className.trim().length > 0
        ? `.${node.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
    const text = (node.textContent ?? '').trim().slice(0, 40);
    violations.push({
      selector: `${tag}${id}${className}${text ? `:"${text}"` : ''}`,
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
