const HEADER_OFFSET_PX = () => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--site-header-height').trim();
  const n = parseFloat(raw);
  return (Number.isFinite(n) ? n : 4) * (raw.endsWith('rem') ? 16 : 1) + 12;
};

export function scrollToHeading(id: string, behavior: ScrollBehavior = 'smooth'): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX();
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

export function setLocationHash(id: string): void {
  const hash = `#${encodeURIComponent(id).replace(/%20/g, '-')}`;
  if (window.location.hash === hash) return;
  window.history.pushState(null, '', `${window.location.pathname}${hash}`);
}
