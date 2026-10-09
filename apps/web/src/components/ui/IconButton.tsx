// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { ICON_GLYPH_PX } from './controlMetrics';

type IconButtonSize = 'sm' | 'md';

type Props = {
  icon: LucideIcon;
  /** Accessible name (aria-label) and default tooltip when title is omitted. */
  label: string;
  title?: string;
  size?: IconButtonSize;
  iconSize?: number;
  strokeWidth?: number;
  expanded?: boolean;
  /** Set for menu triggers; omit for plain icon actions. */
  hasPopup?: 'menu' | false;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label' | 'title'>;

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  {
    icon: Icon,
    label,
    title,
    size = 'md',
    iconSize = ICON_GLYPH_PX,
    strokeWidth = 2,
    expanded,
    hasPopup = false,
    className,
    type = 'button',
    ...rest
  },
  ref
) {
  const sizeClass = size === 'sm' ? 'icon-btn-sm' : 'icon-btn-md';
  return (
    <button
      ref={ref}
      type={type}
      className={`icon-btn ${sizeClass}${className ? ` ${className}` : ''}`}
      aria-label={label}
      title={title ?? label}
      aria-expanded={expanded}
      aria-haspopup={hasPopup || undefined}
      {...rest}
    >
      <Icon size={iconSize} strokeWidth={strokeWidth} aria-hidden />
    </button>
  );
});
