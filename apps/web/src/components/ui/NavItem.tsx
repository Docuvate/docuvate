// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  collapsed?: boolean;
  end?: boolean;
}

export function NavItem({ to, icon: Icon, label, count, collapsed = false, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `nav-item${isActive ? ' nav-item-active' : ''}${collapsed ? ' nav-item-collapsed' : ''}`.trim()
      }
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      {collapsed ? null : (
        <>
          <span className="nav-item-label">{label}</span>
          {count != null ? <span className="nav-item-count">{count}</span> : null}
        </>
      )}
    </NavLink>
  );
}

export function NavItemButton({
  icon: Icon,
  label,
  count,
  collapsed,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  collapsed?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item${active ? ' nav-item-active' : ''}${collapsed ? ' nav-item-collapsed' : ''}`.trim()}
      title={collapsed ? label : undefined}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
      {collapsed ? null : (
        <>
          <span className="nav-item-label">{label}</span>
          {count != null ? <span className="nav-item-count">{count}</span> : null}
        </>
      )}
    </button>
  );
}

export function NavItemLabel({ children }: { children: ReactNode }) {
  return <span className="nav-item-label">{children}</span>;
}
