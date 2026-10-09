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
  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState({ top: 0, height: 20 });
  const sectionIds = items.map((i) => i.id);
  const activeId = useScrollSpy(sectionIds);

  useLayoutEffect(() => {
    const link = linkRefs.current.get(activeId);
    const list = listRef.current;
    if (!link || !list) return;
    const listTop = list.getBoundingClientRect().top;
    const linkTop = link.getBoundingClientRect().top;
    setIndicator({
      top: linkTop - listTop + list.scrollTop,
      height: link.offsetHeight,
    });
  }, [activeId, items]);

  useEffect(() => {
    const link = linkRefs.current.get(activeId);
    link?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  function onClick(event: React.MouseEvent, id: string) {
    event.preventDefault();
    scrollToHeading(id);
    setLocationHash(id);
  }

  return (
    <div className={`docs-toc-rail docs-toc-rail--${variant}`}>
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
  if (!items.length) return null;
  const title = locale === 'de' ? 'Auf dieser Seite' : 'On this page';
  return (
    <details className="docs-toc docs-toc-mobile">
      <summary className="docs-toc-mobile-summary">{title}</summary>
      <TocNav items={items} variant="mobile" />
    </details>
  );
}
