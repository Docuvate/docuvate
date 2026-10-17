// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actions, className = '' }: EmptyStateProps) {
  return (
    <div className={`ds-empty-state${className ? ` ${className}` : ''}`.trim()}>
      <div className="ds-empty-state-icon">
        <Icon size={26} strokeWidth={2} aria-hidden />
      </div>
      <h2 className="ds-empty-state-title">{title}</h2>
      <p className="ds-empty-state-text">{description}</p>
      {actions ? <div className="ds-empty-state-actions">{actions}</div> : null}
    </div>
  );
}
