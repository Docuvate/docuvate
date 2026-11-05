// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { HTMLAttributes, ReactNode } from 'react';

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** `between` pushes the last tool group to the end of the row. */
  justify?: 'start' | 'end' | 'between';
  /** Wrap onto several lines instead of scrolling (default true). */
  wrap?: boolean;
}

/**
 * Horizontal row of tool groups (filters, view switchers, bulk actions).
 * Give it an `aria-label` when it is not inside a labelled region; it then renders as a group.
 */
export function Toolbar({
  children,
  justify = 'start',
  wrap = true,
  className = '',
  ...props
}: ToolbarProps) {
  const labelled = props['aria-label'] != null || props['aria-labelledby'] != null;
  return (
    <div
      role={labelled ? 'group' : undefined}
      className={`ds-toolbar ds-toolbar--${justify}${wrap ? '' : ' ds-toolbar--nowrap'}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface ToolGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Visually attach controls (segmented look) instead of spacing them. */
  attached?: boolean;
}

/** Related controls inside a toolbar, separated from other groups by `--dv-space-md`. */
export function ToolGroup({ children, attached = false, className = '', ...props }: ToolGroupProps) {
  return (
    <div
      className={`ds-tool-group${attached ? ' ds-tool-group--attached' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
