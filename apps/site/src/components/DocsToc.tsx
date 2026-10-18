// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import type { DocsTocItem } from '../hooks/useDocsTocItems';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { scrollToHeading, setLocationHash } from '../lib/scrollToHeading';

type DocsTocProps = {
  items: DocsTocItem[];
  variant: 'desktop' | 'mobile';
};

function TocNav({ items, variant }: DocsTocProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState({ top: 0, height: 18 });
  const [forcedActiveId, setForcedActiveId] = useState<string | null>(null);
  const sectionIds = items.map((i) => i.id);
  const { activeId: spyActiveId, pauseUntilScrollSettled } = useScrollSpy(sectionIds);
  const activeId = forcedActiveId ?? spyActiveId;

  const updateIndicator = () => {
    const link = linkRefs.current.get(activeId);
    const list = listRef.current;
    if (!link || !list) return;
    const listTop = list.getBoundingClientRect().top;
    const linkTop = link.getBoundingClientRect().top;
    setIndicator({
      top: linkTop - listTop + list.scrollTop,
      height: link.offsetHeight,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeId, items]);

  useEffect(() => {
    const onScroll = () => updateIndicator();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    const list = listRef.current;
    list?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      list?.removeEventListener('scroll', onScroll);
    };
  }, [activeId, items]);

  function onClick(event: React.MouseEvent, id: string) {
    event.preventDefault();
    setForcedActiveId(id);
    pauseUntilScrollSettled();
    scrollToHeading(id);
    setLocationHash(id);
    window.setTimeout(() => setForcedActiveId(null), 1100);
  }

  return (
    <div ref={railRef} className={`docs-toc-rail docs-toc-rail--${variant}`}>
      <span
        className="docs-toc-indicator"
        aria-hidden
        style={{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px` }}
      />
      <ul ref={listRef} className="docs-toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`docs-toc-item docs-toc-item--h${item.level}${activeId === item.id ? ' is-active' : ''}`}
          >
            <a
              ref={(el) => {
                if (el) linkRefs.current.set(item.id, el);
                else linkRefs.current.delete(item.id);
              }}
              className="docs-toc-link"
              href={`#${item.id}`}
              data-toc-id={item.id}
              aria-current={activeId === item.id ? 'location' : undefined}
              onClick={(e) => onClick(e, item.id)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocsTocDesktop({ items }: { items: DocsTocItem[] }) {
  const { locale } = useLocale();
  if (!items.length) return null;
  const title = locale === 'de' ? 'Auf dieser Seite' : 'On this page';
  return (
    <nav className="docs-toc docs-toc-desktop" aria-label={title}>
      <p className="docs-toc-title">{title}</p>
      <TocNav items={items} variant="desktop" />
    </nav>
  );
}

export function DocsTocMobile({ items }: { items: DocsTocItem[] }) {
  const { locale } = useLocale();
  const sectionIds = items.map((i) => i.id);
  const { activeId, pauseUntilScrollSettled } = useScrollSpy(sectionIds);
  const [open, setOpen] = useState(false);

  if (!items.length) return null;
  const title = locale === 'de' ? 'Auf dieser Seite' : 'On this page';
  const activeLabel = items.find((i) => i.id === activeId)?.label ?? items[0]?.label ?? title;

  function jumpTo(id: string) {
    pauseUntilScrollSettled();
    scrollToHeading(id);
    setLocationHash(id);
    setOpen(false);
  }

  return (
    <div className={`docs-toc-mobile-bar${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="docs-toc-mobile-bar-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="docs-toc-mobile-bar-label">{title}</span>
        <span className="docs-toc-mobile-bar-active">{activeLabel}</span>
      </button>
      {open ? (
        <ul className="docs-toc-mobile-bar-menu" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`docs-toc-mobile-bar-item${activeId === item.id ? ' is-active' : ''}`}
                aria-current={activeId === item.id ? 'location' : undefined}
                onClick={() => jumpTo(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
