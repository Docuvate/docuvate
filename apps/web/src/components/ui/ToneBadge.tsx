// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info';

interface ToneBadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/**
 * System status badge (counts, states, "new"). User-defined labels use `Chip`;
 * document processing status uses `Badge`.
 */
export function ToneBadge({ tone = 'neutral', children, className = '' }: ToneBadgeProps) {
  return (
    <span className={`badge ds-badge ds-badge--${tone}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  );
}
