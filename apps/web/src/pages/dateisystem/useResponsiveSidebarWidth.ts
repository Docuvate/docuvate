import { useEffect, useState } from 'react';

const NARROW_MAX = 1280;
const NARROW_CAP = 260;

export function useResponsiveSidebarWidth(storedWidth: number): number {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= NARROW_MAX : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_MAX}px)`);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return narrow ? NARROW_CAP : storedWidth;
}
