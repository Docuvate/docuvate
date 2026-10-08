import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToHeading } from '../lib/scrollToHeading';

/** Scroll to hash targets after route changes; scroll to top when navigating without a hash. */
export function SiteScrollManager() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if (hash.length > 1) {
      const id = decodeURIComponent(hash.slice(1));
      requestAnimationFrame(() => {
        scrollToHeading(id, 'auto');
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash, key]);

  return null;
}
