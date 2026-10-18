// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BannerProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'accent' | 'danger' | 'success' | 'info';
  className?: string;
}

export function Banner({
  icon: Icon,
  title,
  description,
  action,
  variant = 'accent',
  className = '',
}: BannerProps) {
  const variantClass =
    variant === 'danger'
      ? ' ds-banner-danger'
      : variant === 'success'
        ? ' ds-banner-success'
        : variant === 'info'
          ? ' ds-banner-info'
          : '';
  return (
    <div className={`ds-banner${variantClass}${className ? ` ${className}` : ''}`.trim()} role="status">
      <Icon size={20} strokeWidth={2} aria-hidden />
      <div className="ds-banner-body">
        <p className="ds-banner-title">{title}</p>
        {description ? <p className="ds-banner-text">{description}</p> : null}
      </div>
      {action ? <div className="ds-banner-action">{action}</div> : null}
    </div>
  );
}
