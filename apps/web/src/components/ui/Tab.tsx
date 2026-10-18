// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Tab({ active = false, className = '', children, type = 'button', ...props }: TabProps) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={active}
      className={`tab${active ? ' tab-active' : ''}${className ? ` ${className}` : ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`tab-bar${className ? ` ${className}` : ''}`.trim()} role="tablist">
      {children}
    </div>
  );
}
