// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';

const NARROW_MAX = 1280;
/** Upper bound on medium-width screens; the user's stored width is respected below it. */
const NARROW_CAP = 320;

export function useResponsiveSidebarWidth(storedWidth: number): number {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= NARROW_MAX : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${String(NARROW_MAX)}px)`);
    const sync = () => { setNarrow(mq.matches); };
    sync();
    mq.addEventListener('change', sync);
    return () => { mq.removeEventListener('change', sync); };
  }, []);

  return narrow ? Math.min(storedWidth, NARROW_CAP) : storedWidth;
}
