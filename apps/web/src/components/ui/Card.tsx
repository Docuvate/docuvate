// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardVariant = 'raised' | 'outlined' | 'muted';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `raised` (default): white surface + elevation 1. `outlined`: no shadow. `muted`: inset section. */
  variant?: CardVariant;
  /** Inner padding from the spacing scale; default `lg`. */
  padding?: CardPadding;
}

export function Card({ className = '', variant = 'raised', padding = 'lg', ...props }: CardProps) {
  const modifiers = `${variant === 'raised' ? '' : ` card--${variant}`}${padding === 'lg' ? '' : ` card--pad-${padding}`}`;
  return <div className={`card${modifiers} ${className}`.trim()} {...props} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Heading level inside the page outline (default h2). */
  as?: 'h2' | 'h3' | 'h4';
  titleId?: string;
  className?: string;
}

/** Title row for cards and panels: heading + optional lead + trailing actions. */
export function CardHeader({
  title,
  description,
  actions,
  as: Heading = 'h2',
  titleId,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`ds-card-header${className ? ` ${className}` : ''}`}>
      <div className="ds-card-header-text">
        <Heading id={titleId} className="ds-card-header-title">
          {title}
        </Heading>
        {description ? <p className="ds-card-header-lead">{description}</p> : null}
      </div>
      {actions ? <div className="ds-card-header-actions">{actions}</div> : null}
    </div>
  );
}
