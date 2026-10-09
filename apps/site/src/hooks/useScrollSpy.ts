import { useEffect, useRef, useState } from 'react';
import { getDocsScrollOffsetPx } from '../lib/scrollOffset';

export type ScrollSpyController = {
  activeId: string;
  /** Pause spy updates until programmatic scroll finishes (TOC click). */
  pauseUntilScrollSettled: () => void;
};

export function useScrollSpy(sectionIds: string[]): ScrollSpyController {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sectionIds.length) {
      setActiveId('');
      return undefined;
    }

    const resolveActive = () => {
      if (pausedRef.current) return;

      const threshold = getDocsScrollOffsetPx();
      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => Boolean(el));

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;

      let current = first.id;
      for (const el of elements) {
        const top = el.getBoundingClientRect().top;
        if (top <= threshold + 0.5) {
          current = el.id;
        }
      }

      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
      if (atBottom) {
        current = last.id;
      }

      setActiveId((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        resolveActive();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    resolveActive();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [sectionIds.join('|')]);

  const pauseUntilScrollSettled = () => {
    pausedRef.current = true;
    const end = () => {
      pausedRef.current = false;
      window.dispatchEvent(new Event('scroll'));
    };
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', end, { once: true });
    }
    window.setTimeout(end, 1000);
  };

  return { activeId, pauseUntilScrollSettled };
}
