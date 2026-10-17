// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const { t } = useTranslation();
  return (
    <nav className={`breadcrumb${className ? ` ${className}` : ''}`.trim()} aria-label={t('ui.breadcrumb.label')}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = `${item.label}-${String(index)}`;
        return (
          <span key={key} className="breadcrumb-part">
            {index > 0 ? <ChevronRight size={14} className="breadcrumb-sep" aria-hidden /> : null}
            {isLast || !item.to ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <Link className="breadcrumb-link" to={item.to}>
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function BreadcrumbStatic({ children }: { children: ReactNode }) {
  return <nav className="breadcrumb">{children}</nav>;
}
