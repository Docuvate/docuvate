// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useLayoutEffect, useRef, useState } from 'react';

interface DashboardWidgetTitleProps {
  title: string;
}

export function DashboardWidgetTitle({ title }: DashboardWidgetTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);
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
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [title]);

  return (
    <h2
      ref={ref}
      className="dashboard-widget-title"
      title={truncated ? title : undefined}
    >
      {title}
    </h2>
  );
}
