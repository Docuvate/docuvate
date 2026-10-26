// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect, useState } from 'react';

function readMaxWidth(maxWidthPx: number): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(`(max-width: ${String(maxWidthPx)}px)`).matches;
}

/** True when the viewport is at most `maxWidthPx` wide. */
export function useViewportMaxWidth(maxWidthPx: number): boolean {
  const [matches, setMatches] = useState(() => readMaxWidth(maxWidthPx));

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${String(maxWidthPx)}px)`);
    const sync = () => {
      setMatches(mq.matches);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
    };
  }, [maxWidthPx]);

  return matches;
}
