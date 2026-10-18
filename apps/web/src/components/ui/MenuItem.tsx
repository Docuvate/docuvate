// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: ReactNode;
  icon?: LucideIcon;
  shortcut?: string;
  variant?: 'default' | 'active' | 'danger';
}

export function MenuItem({
  label,
  icon: Icon,
  shortcut,
  variant = 'default',
  className = '',
  type = 'button',
  ...props
}: MenuItemProps) {
  const variantClass =
    variant === 'active' ? ' menu-item-active' : variant === 'danger' ? ' menu-item-danger' : '';
  return (
    <button
      type={type}
      className={`menu-item${variantClass}${className ? ` ${className}` : ''}`.trim()}
      {...props}
    >
      {Icon ? <Icon size={16} strokeWidth={2} aria-hidden /> : null}
      <span className="menu-item-label">{label}</span>
      {shortcut ? <span className="menu-item-shortcut">{shortcut}</span> : null}
    </button>
  );
}
