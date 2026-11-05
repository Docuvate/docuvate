// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { AlertTriangle, CheckCircle2, Info, type LucideIcon, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Spinner } from './Spinner';

type InlineStatusTone = 'neutral' | 'loading' | 'success' | 'warn' | 'error';

interface InlineStatusProps {
  tone?: InlineStatusTone;
  children: ReactNode;
  className?: string;
  /** Optional trailing action (retry, open settings). */
  action?: ReactNode;
}

const ICONS: Record<Exclude<InlineStatusTone, 'loading'>, LucideIcon> = {
  neutral: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
};

/**
 * Inline feedback for a section: loading, empty/neutral, success, warning or error.
 * Errors are announced assertively (role="alert"); everything else politely (role="status").
 * For page-level empty states use `EmptyState`; for app-wide notices use `Banner` or toasts.
 */
export function InlineStatus({
  tone = 'neutral',
  children,
  className = '',
  action,
}: InlineStatusProps) {
  const Icon = tone === 'loading' ? null : ICONS[tone];
  return (
    <div
      className={`ds-inline-status ds-inline-status--${tone}${className ? ` ${className}` : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-busy={tone === 'loading' || undefined}
    >
      {Icon ? (
        <Icon className="ds-inline-status-icon" size={16} strokeWidth={2} aria-hidden />
      ) : (
        <Spinner size="sm" decorative />
      )}
      <span className="ds-inline-status-text">{children}</span>
      {action ? <span className="ds-inline-status-action">{action}</span> : null}
    </div>
  );
}
