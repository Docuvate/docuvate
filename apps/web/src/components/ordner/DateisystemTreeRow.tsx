import type { DragEvent, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const TREE_ICON = 16;

export interface DateisystemTreeRowProps {
  to: string;
  isActive: boolean;
  depth?: number;
  treeItemId: string;
  chevron: ReactNode;
  icon: ReactNode;
  name: string;
  count: number;
  countAriaLabel?: string;
  countTitle?: string;
  actions: ReactNode;
  dropTarget?: boolean;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (event: DragEvent) => void;
  linkClassName?: string;
}

export function DateisystemTreeRow({
  to,
  isActive,
  depth = 0,
  treeItemId,
  chevron,
  icon,
  name,
  count,
  countAriaLabel,
  countTitle,
  actions,
  dropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  linkClassName = '',
}: DateisystemTreeRowProps) {
  return (
    <div
      className={`dateisystem-tree-row${isActive ? ' is-selected' : ''}${dropTarget ? ' drop-target' : ''}`}
      style={{ ['--tree-depth' as string]: String(depth) }}
      data-treeitem-id={treeItemId}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="dateisystem-tree-row-lead">
        <div className="dateisystem-tree-chevron-cell">{chevron}</div>
        <NavLink
          to={to}
          title={name}
          className={({ isActive: navActive }) =>
            `sidebar-tree-link dateisystem-tree-link${navActive || isActive ? ' active' : ''} ${linkClassName}`.trim()
          }
          end={false}
        >
          {icon}
          <span className="sidebar-tree-name">{name}</span>
        </NavLink>
      </div>
      <div className="dateisystem-tree-row-trailing" aria-hidden={false}>
        <span
          className="dateisystem-tree-count sidebar-count"
          aria-label={countAriaLabel}
          title={countTitle}
        >
          {count}
        </span>
        <div className="dateisystem-tree-actions">{actions}</div>
      </div>
    </div>
  );
}

export { TREE_ICON };
