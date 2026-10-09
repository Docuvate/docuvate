// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import { slugifyHeading } from '../lib/slugify';

export type DocsTocItem = {
  id: string;
  label: string;
  level: 2 | 3;
};

function ensureHeadingIds(article: HTMLElement): DocsTocItem[] {
  const seen = new Map<string, number>();
  const items: DocsTocItem[] = [];

  article.querySelectorAll('h2, h3').forEach((node) => {
    if (!(node instanceof HTMLHeadingElement)) return;
    const level = node.tagName === 'H2' ? 2 : 3;
    let id = node.id;
    if (!id) {
      const base = slugifyHeading(node.textContent ?? 'section');
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      id = count === 0 ? base : `${base}-${count + 1}`;
      node.id = id;
    }
    if (!node.classList.contains('docs-heading')) {
      node.classList.add('docs-heading', level === 2 ? 'docs-heading-h2' : 'docs-heading-h3');
    }
    items.push({ id, label: (node.textContent ?? '').trim(), level });
  });

  return items;
}

export function useDocsTocItems(
  articleRef: RefObject<HTMLElement | null>,
  refreshKey: string
): DocsTocItem[] {
  const [items, setItems] = useState<DocsTocItem[]>([]);

  const refresh = useCallback(() => {
    const article = articleRef.current;
    if (!article) {
      setItems([]);
      return;
    }
    setItems(ensureHeadingIds(article));
  }, [articleRef]);

  useLayoutEffect(() => {
    refresh();
    const article = articleRef.current;
    if (!article || typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(() => refresh());
    observer.observe(article, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [refresh, refreshKey]);

  return items;
}
