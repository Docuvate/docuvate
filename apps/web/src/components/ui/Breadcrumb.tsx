// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { type BreadcrumbPlanSegment,planBreadcrumbDisplay } from './breadcrumbDisplayPlan';
import { Menu, MenuContent, MenuTrigger } from './overlay/Menu';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Overrides default `ui.breadcrumb.label` for the nav landmark. */
  ariaLabel?: string;
  /** When set, the last item is rendered as a link (ellipsis); use when the page title shows the current location. */
  trailEndsWithLink?: boolean;
}

function BreadcrumbSeparator() {
  return <ChevronRight size={14} className="breadcrumb-sep" aria-hidden />;
}

function BreadcrumbCollapsedMenu({
  items,
  menuAriaLabel,
}: {
  items: BreadcrumbItem[];
  menuAriaLabel: string;
}) {
  return (
    <Menu>
      <MenuTrigger className="breadcrumb-ellipsis-trigger" aria-label={menuAriaLabel}>
        …
      </MenuTrigger>
      <MenuContent className="breadcrumb-collapsed-menu popover-surface" align="start">
        {items.map((item) => {
          const key = item.to ? `${item.to}:${item.label}` : item.label;
          if (item.to) {
            return (
              <Link
                key={key}
                className="menu-item breadcrumb-collapsed-menu-item"
                role="menuitem"
                to={item.to}
              >
                <span className="menu-item-label">{item.label}</span>
              </Link>
            );
          }
          return (
            <span key={key} className="menu-item breadcrumb-collapsed-menu-item" role="menuitem">
              <span className="menu-item-label">{item.label}</span>
            </span>
          );
        })}
      </MenuContent>
    </Menu>
  );
}

function breadcrumbPartClass(segment: BreadcrumbPlanSegment): string {
  switch (segment.kind) {
    case 'link':
      return segment.ellipsis
        ? 'breadcrumb-part breadcrumb-part--ellipsis'
        : 'breadcrumb-part breadcrumb-part--fixed';
    case 'current':
      return 'breadcrumb-part breadcrumb-part--current';
    case 'collapsed':
      return 'breadcrumb-part breadcrumb-part--menu';
    default: {
      const never: never = segment;
      return never;
    }
  }
}

function segmentKey(segment: BreadcrumbPlanSegment): string {
  switch (segment.kind) {
    case 'link':
      return `link-${String(segment.index)}-${segment.to}`;
    case 'current':
      return `current-${String(segment.index)}`;
    case 'collapsed':
      return 'collapsed';
    default: {
      const never: never = segment;
      return never;
    }
  }
}

export function Breadcrumb({
  items,
  className = '',
  ariaLabel,
  trailEndsWithLink = false,
}: BreadcrumbProps) {
  const { t } = useTranslation();
  const plan = planBreadcrumbDisplay(items, { trailEndsWithLink });
  const navLabel = ariaLabel ?? t('ui.breadcrumb.label');
  const collapsedMenuAria = t('ui.breadcrumb.collapsedSegmentsMenu');

  return (
    <nav
      className={`breadcrumb${className ? ` ${className}` : ''}`.trim()}
      aria-label={navLabel}
    >
      {plan.map((segment, planIndex) => {
        return (
          <span key={segmentKey(segment)} className={breadcrumbPartClass(segment)}>
            {planIndex > 0 ? <BreadcrumbSeparator /> : null}
            {segment.kind === 'link' ? (
              <Link className="breadcrumb-link" to={segment.to} title={segment.label}>
                {segment.label}
              </Link>
            ) : null}
            {segment.kind === 'current' ? (
              <span className="breadcrumb-current" title={segment.label}>{segment.label}</span>
            ) : null}
            {segment.kind === 'collapsed' ? (
              <BreadcrumbCollapsedMenu items={segment.items} menuAriaLabel={collapsedMenuAria} />
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}

export function BreadcrumbStatic({ children }: { children: ReactNode }) {
  return <nav className="breadcrumb">{children}</nav>;
}
