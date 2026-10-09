import { useEffect, useState } from 'react';

const HEADER_PX = 72;

export function useScrollSpy(sectionIds: string[]): string {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    if (!sectionIds.length) {
      setActiveId('');
      return undefined;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const firstVisible = visible[0];
        if (firstVisible) {
          setActiveId(firstVisible.target.id);
          return;
        }
        const above = entries
          .filter((e) => e.boundingClientRect.top < HEADER_PX)
          .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);
        const firstAbove = above[0];
        if (firstAbove) {
          setActiveId(firstAbove.target.id);
        }
      },
      {
        root: null,
        rootMargin: `-${HEADER_PX}px 0px -60% 0px`,
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds.join('|')]);

  return activeId;
}
