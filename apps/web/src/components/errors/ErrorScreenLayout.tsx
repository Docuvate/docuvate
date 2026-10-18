// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { ErrorCodeDetails } from './ErrorCodeDetails';

export interface ErrorScreenLayoutProps {
  icon: LucideIcon;
  title: string;
  description: string;
  statusSlot?: ReactNode;
  actions?: ReactNode;
  errorCode?: string;
  requestId?: string;
  className?: string;
}

export function ErrorScreenLayout({
  icon: Icon,
  title,
  description,
  statusSlot,
  actions,
  errorCode,
  requestId,
  className = '',
}: ErrorScreenLayoutProps) {
  const showCodeBlock = Boolean(errorCode && requestId);

  return (
    <section className={`ds-error-screen${className ? ` ${className}` : ''}`.trim()} aria-labelledby="error-screen-title">
      <div className="ds-error-screen-icon-slot">
        <div className="ds-error-screen-icon">
          <Icon size={32} strokeWidth={2} aria-hidden />
        </div>
      </div>
      <div className="ds-error-screen-title-slot">
        <h1 id="error-screen-title" className="ds-error-screen-title">
          {title}
        </h1>
      </div>
      <div className="ds-error-screen-text-slot">
        <p className="ds-error-screen-text">{description}</p>
      </div>
      <div className="ds-error-screen-status-slot">{statusSlot ?? <span aria-hidden />}</div>
      <div className="ds-error-screen-actions-slot">
        {actions ? <div className="ds-error-screen-actions">{actions}</div> : <span aria-hidden />}
      </div>
      <div className="ds-error-screen-code-slot">
        {showCodeBlock && errorCode && requestId ? (
          <ErrorCodeDetails code={errorCode} requestId={requestId} />
        ) : (
          <span aria-hidden />
        )}
      </div>
    </section>
  );
}
