// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DocsSidebar } from './DocsSidebar';
import { DocsTocDesktop, DocsTocMobile } from './DocsToc';
import { useDocsTocItems } from '../hooks/useDocsTocItems';

export function DocsPageLayout({ children }: { children: ReactNode }) {
  const articleRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const tocItems = useDocsTocItems(articleRef, location.pathname);

  return (
    <div className="site-container docs-layout">
      <DocsSidebar />
      <div className="docs-main">
        <DocsTocMobile items={tocItems} />
        <article ref={articleRef} className="docs-prose docs-article">
          {children}
        </article>
      </div>
      <DocsTocDesktop items={tocItems} />
    </div>
  );
}
