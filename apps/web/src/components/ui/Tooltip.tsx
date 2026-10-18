// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

export interface TooltipProps {
  text: string;
  children: ReactNode;
  className?: string;
}

/** Lightweight title-tooltip wrapper (full popover positioning deferred to product surfaces). */
export function Tooltip({ text, children, className = '' }: TooltipProps) {
  return (
    <span className={className} title={text}>
      {children}
    </span>
  );
}

export function TooltipBubble({ text }: { text: string }) {
  return <span className="tooltip-bubble">{text}</span>;
}
