import { routes } from './routes';

/** True when this saved view should show as the active documents sidebar link. */
export function savedViewSidebarLinkIsActive(
  pathname: string,
  search: string,
  viewId: string
): boolean {
  if (pathname !== routes.documents) {
    return false;
  }
  return new URLSearchParams(search).get('view') === viewId;
}
