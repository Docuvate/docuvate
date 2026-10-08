import type { RawInteractiveElement } from '../metrics/targets.js';

/** Runs in the browser via page.evaluate (self-contained). */
export function scanInteractiveTargets(): RawInteractiveElement[] {
  const route = window.location.pathname;
  const selector =
    'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="switch"]';

  const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
    if (el.closest('[aria-hidden="true"]')) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return false;
    }
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') {
      return false;
    }
    return true;
  });

  return elements.map((el) => {
    const rect = el.getBoundingClientRect();
    const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
    const name =
      el.getAttribute('aria-label') ??
      (el as HTMLInputElement).labels?.[0]?.textContent?.trim() ??
      el.textContent?.trim()?.slice(0, 80) ??
      '';

    const isPrimary =
      el.getAttribute('data-ux') === 'primary-action' ||
      el.classList.contains('btn-primary') ||
      el.getAttribute('data-variant') === 'primary' ||
      (el.tagName === 'BUTTON' && el.className.includes('primary'));

    const icon = el.querySelector('svg, .sidebar-link-icon, [aria-hidden="true"]');
    let iconBox: RawInteractiveElement['iconBox'] = null;
    if (icon instanceof HTMLElement) {
      const ir = icon.getBoundingClientRect();
      iconBox = { x: ir.x, y: ir.y, width: ir.width, height: ir.height };
    }

    let buttonGroupSiblingHeight: number | null = null;
    const parent = el.parentElement;
    if (parent && el.tagName === 'BUTTON') {
      const siblings = [...parent.querySelectorAll(':scope > button')].filter(
        (s) => s !== el
      ) as HTMLElement[];
      if (siblings.length > 0) {
        buttonGroupSiblingHeight = siblings[0]!.getBoundingClientRect().height;
      }
    }

    const ux = el.getAttribute('data-ux');
    const selectorHint = ux
      ? `[data-ux="${ux}"]`
      : `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`;

    return {
      route,
      selectorHint,
      role,
      name,
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      isPrimaryControl: isPrimary,
      hasIcon: icon instanceof HTMLElement,
      iconBox,
      buttonGroupSiblingHeight,
    };
  });
}
