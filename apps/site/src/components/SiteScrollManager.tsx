// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isScalarApiHash, scheduleApiPageScrollSync } from '../lib/apiPageScroll';
import { scrollToHeading } from '../lib/scrollToHeading';

/** Scroll to hash targets after route changes; scroll to top when navigating without a hash. */
export function SiteScrollManager() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    const onApiPage = pathname.includes('/docs/api');
    if (onApiPage && isScalarApiHash(hash)) {
      scheduleApiPageScrollSync();
      return;
    }
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
