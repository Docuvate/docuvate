import type { HickDecisionPoint } from '../metrics/types.js';

/** Runs in the browser via page.evaluate (no nested helpers; tsx-safe). */
export function scanHickDecisionPoints(): HickDecisionPoint[] {
  const points: HickDecisionPoint[] = [];

  const sidebar = document.querySelector('.sidebar-nav');
  if (sidebar) {
    const links = [...sidebar.querySelectorAll<HTMLElement>('a.sidebar-link')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const style = getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    points.push({
      id: 'primary-nav',
      label: 'Primary sidebar navigation',
      visibleChoices: links.length,
    });
  }

  const topbar = document.querySelector('.app-topbar');
  if (topbar) {
    const controls = [...topbar.querySelectorAll<HTMLElement>('button, input, a')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const style = getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    points.push({
      id: 'topbar-controls',
      label: 'Top bar (search, locale, account)',
      visibleChoices: controls.length,
    });
  }

  const pageHeader = document.querySelector('.page-header');
  if (pageHeader) {
    const controls = [...pageHeader.querySelectorAll<HTMLElement>('button, select, a')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const style = getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none';
    });
    points.push({
      id: 'page-header-toolbar',
      label: 'Page header toolbar',
      visibleChoices: controls.length,
    });
  }

  return points;
}
