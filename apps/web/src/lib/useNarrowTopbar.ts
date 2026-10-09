// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect, useState } from 'react';
import { NARROW_VIEWPORT_MEDIA_QUERY, readNarrowViewport } from './narrowViewport';

/**
 * True when viewport width is ≤ {@link NARROW_VIEWPORT_MAX_WIDTH_PX} (768px).
 * Uses layout effect so the first paint matches matchMedia (avoids table flash on phones).
 */
export function useNarrowTopbar(): boolean {
  const [matches, setMatches] = useState(readNarrowViewport);

  useLayoutEffect(() => {
    const mq = window.matchMedia(NARROW_VIEWPORT_MEDIA_QUERY);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return matches;
}
