/** Keep `--site-header-height` in sync with the rendered sticky header (px). */
export function observeSiteHeaderHeight(): () => void {
  const header = document.querySelector('.site-header');
  if (!(header instanceof HTMLElement)) {
    return () => undefined;
  }

  const apply = () => {
    const height = header.getBoundingClientRect().height;
    if (height > 0) {
      document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    }
  };

  apply();
  const ro = new ResizeObserver(apply);
  ro.observe(header);
  window.addEventListener('resize', apply, { passive: true });

  return () => {
    ro.disconnect();
    window.removeEventListener('resize', apply);
  };
}
