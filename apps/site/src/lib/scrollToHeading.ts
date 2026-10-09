import { getDocsScrollOffsetPx } from './scrollOffset';

export function scrollToHeading(id: string, behavior: ScrollBehavior = 'smooth'): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - getDocsScrollOffsetPx();
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

export function setLocationHash(id: string): void {
  const hash = `#${encodeURIComponent(id).replace(/%20/g, '-')}`;
  if (window.location.hash === hash) return;
  window.history.pushState(null, '', `${window.location.pathname}${hash}`);
}
