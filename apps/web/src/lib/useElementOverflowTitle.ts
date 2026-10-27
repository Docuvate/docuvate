// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type RefObject, useLayoutEffect, useState } from 'react';

/** Native `title` tooltip only when the element’s text overflows its box. */
export function useElementOverflowTitle(
  ref: RefObject<HTMLElement | null>,
  text: string
): string | undefined {
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth + 1);
    };
    check();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [ref, text]);

  return truncated ? text : undefined;
}
