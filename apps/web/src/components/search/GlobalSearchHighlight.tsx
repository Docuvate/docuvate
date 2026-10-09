// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import type { SearchHighlightSpan } from '@docuvate/contracts';

export function GlobalSearchHighlight({
  text,
  spans,
}: {
  text: string;
  spans: SearchHighlightSpan[];
}) {
  if (spans.length === 0) return <>{text}</>;
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((span, i) => {
    if (span.start > cursor) {
      nodes.push(text.slice(cursor, span.start));
    }
    nodes.push(
      <mark key={`${span.start}-${i}`} className="global-search-mark">
        {text.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  });
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return <>{nodes}</>;
}
