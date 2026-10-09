import { patchSidebarGroupToggleSrOnly } from './scalarDeDomPatch';

const ACCORDION_CLICK_ATTR = 'data-docuvate-accordion-click';

function sidebarGroupItem(toggle: HTMLElement): HTMLElement | null {
  const li = toggle.closest('nav.sidebar-pages li.sidebar-group-item');
  return li instanceof HTMLElement ? li : null;
}

function collapseOtherGroups(openLi: HTMLElement): void {
  const list = openLi.parentElement;
  if (!list) return;
  list.querySelectorAll(':scope > li.sidebar-group-item').forEach((sibling) => {
    if (sibling === openLi) return;
    const open = sibling.querySelector('button[aria-expanded="true"]');
    if (!(open instanceof HTMLElement)) return;
    if (open.hasAttribute(ACCORDION_CLICK_ATTR)) return;
    open.setAttribute(ACCORDION_CLICK_ATTR, '1');
    open.click();
    open.removeAttribute(ACCORDION_CLICK_ATTR);
  });
}

/** One expanded tag group in the Scalar sidebar; avoids a sticky list taller than the viewport. */
export function observeScalarSidebarAccordion(root: HTMLElement): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const toggle = target.closest(
      'nav.sidebar-pages button[aria-expanded], nav.sidebar-pages .sidebar-heading button',
    );
    if (!(toggle instanceof HTMLElement)) return;
    const li = sidebarGroupItem(toggle);
    if (!li) return;

    const refreshLabels = () => patchSidebarGroupToggleSrOnly(root);
    window.setTimeout(() => {
      if (toggle.getAttribute('aria-expanded') !== 'true') {
        refreshLabels();
        return;
      }
      collapseOtherGroups(li);
      refreshLabels();
      window.setTimeout(refreshLabels, 50);
      root.dispatchEvent(new CustomEvent('docuvate-sidebar-layout'));
    }, 0);
  };

  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}

function siteHeaderBottom(): number {
  return document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
}

/** Sticky sidebar nav with bottom-pin when the open group is taller than the viewport. */
export function observeScalarSidebarSticky(root: HTMLElement): () => void {
  const navList = () =>
    root.querySelector<HTMLElement>('.references-navigation-list, aside.references-navigation');

  const update = () => {
    const el = navList();
    if (!el) return;
    const hb = siteHeaderBottom();
    const listHeight = el.getBoundingClientRect().height;
    const bottomPin = window.innerHeight - listHeight;
    const stickyTop = bottomPin < hb - 1 ? Math.max(hb + 2, bottomPin) : hb;
    el.style.setProperty('--docuvate-sidebar-sticky-top', `${stickyTop}px`);
    el.style.setProperty('--docuvate-sidebar-list-height', `${listHeight}px`);
  };

  const onLayout = () => window.requestAnimationFrame(update);
  update();

  window.addEventListener('scroll', onLayout, { passive: true });
  window.addEventListener('resize', onLayout);
  root.addEventListener('docuvate-sidebar-layout', onLayout);
  const observer = new MutationObserver(onLayout);
  const list = navList();
  if (list) {
    observer.observe(list, { childList: true, subtree: true, attributes: true });
  }

  return () => {
    window.removeEventListener('scroll', onLayout);
    window.removeEventListener('resize', onLayout);
    root.removeEventListener('docuvate-sidebar-layout', onLayout);
    observer.disconnect();
  };
}
