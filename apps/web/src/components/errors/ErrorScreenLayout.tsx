// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { ErrorCodeDetails } from './ErrorCodeDetails';

export interface ErrorScreenLayoutProps {
  icon?: LucideIcon;
  hero?: ReactNode;
  title: string;
  description: string;
  statusSlot?: ReactNode;
  actions?: ReactNode;
  footerSlot?: ReactNode;
  errorCode?: string;
  requestId?: string;
  className?: string;
  compact?: boolean;
}

export function ErrorScreenLayout({
  icon: Icon,
  hero,
  title,
  description,
  statusSlot,
  actions,
  footerSlot,
  errorCode,
  requestId,
  className = '',
  compact = false,
}: ErrorScreenLayoutProps) {
  const showCodeBlock = Boolean(errorCode && requestId);
  const showHero = hero != null;
  const showIcon = Icon != null && !showHero;

  return (
    <section
      className={`ds-error-screen${compact ? ' ds-error-screen--compact' : ''}${className ? ` ${className}` : ''}`.trim()}
      aria-labelledby="error-screen-title"
    >
      {showHero ? (
        <div className="ds-error-screen-hero-slot">{hero}</div>
      ) : showIcon ? (
        <div className="ds-error-screen-icon-slot">
          <div className="ds-error-screen-icon">
            <Icon size={32} strokeWidth={2} aria-hidden />
          </div>
        </div>
      ) : null}
      <div className="ds-error-screen-title-slot">
        <h1 id="error-screen-title" className="ds-error-screen-title">
          {title}
        </h1>
      </div>
      <div className="ds-error-screen-text-slot">
        <p className="ds-error-screen-text">{description}</p>
      </div>
      <div className="ds-error-screen-status-slot">{statusSlot ?? null}</div>
      <div className="ds-error-screen-actions-slot">
        {actions ? <div className="ds-error-screen-actions">{actions}</div> : null}
      </div>
      <div className="ds-error-screen-code-slot">
        {showCodeBlock && errorCode && requestId ? (
          <ErrorCodeDetails code={errorCode} requestId={requestId} />
        ) : null}
        {footerSlot}
      </div>
    </section>
  );
}
