import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ICON_SIZE = 16;
const ICON_STROKE = 1.75;

export interface BorderCollapsibleRailProps {
  collapsed: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
  railClassName?: string;
  panelClassName?: string;
  collapsedPanelClassName?: string;
  toggleClassName?: string;
  /** Panel sits left of content; toggle on the right edge of the panel. */
  children: ReactNode;
}

export function BorderCollapsibleRail({
  collapsed,
  onToggle,
  expandLabel,
  collapseLabel,
  railClassName = '',
  panelClassName = '',
  collapsedPanelClassName = '',
  toggleClassName = '',
  children,
}: BorderCollapsibleRailProps) {
  return (
    <div
      className={`border-collapsible-rail${collapsed ? ' border-collapsible-rail-collapsed' : ''} ${railClassName}`.trim()}
    >
      <div
        className={`border-collapsible-panel ${panelClassName}${collapsed ? ` ${collapsedPanelClassName}` : ''}`.trim()}
      >
        {children}
      </div>
      <button
        type="button"
        className={`border-rail-toggle ${toggleClassName}`.trim()}
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? expandLabel : collapseLabel}
      >
        {collapsed ? (
          <ChevronRight size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
        ) : (
          <ChevronLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
        )}
      </button>
    </div>
  );
}
