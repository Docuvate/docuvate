// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect, useState } from 'react';

/** Stacked card rows for dense tables (admin users, label vocabulary). */
export const STACKED_TABLE_MAX_WIDTH_PX = 640;

export const STACKED_TABLE_MEDIA_QUERY = `(max-width: ${String(STACKED_TABLE_MAX_WIDTH_PX)}px)`;

export function readStackedTableLayout(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(STACKED_TABLE_MEDIA_QUERY).matches;
}

export function useStackedTableLayout(): boolean {
  const [matches, setMatches] = useState(readStackedTableLayout);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia(STACKED_TABLE_MEDIA_QUERY);
    const sync = () => { setMatches(mq.matches); };
    sync();
    mq.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); };
  }, []);

  return matches;
}
