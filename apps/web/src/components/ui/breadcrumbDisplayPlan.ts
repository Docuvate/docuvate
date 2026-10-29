// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { BreadcrumbItem } from './Breadcrumb';

export type BreadcrumbPlanSegment =
  | { kind: 'link'; index: number; label: string; to: string; ellipsis: boolean }
  | { kind: 'current'; index: number; label: string }
  | { kind: 'collapsed'; items: BreadcrumbItem[] };

export interface BreadcrumbPlanOptions {
  /** Last crumb is a link; page title is shown outside the breadcrumb. */
  trailEndsWithLink?: boolean;
}

function linkSegment(
  item: BreadcrumbItem,
  index: number,
  ellipsis: boolean
): BreadcrumbPlanSegment {
  const to = item.to;
  if (!to) {
    return { kind: 'current', index, label: item.label };
  }
  return { kind: 'link', index, label: item.label, to, ellipsis };
}

/** Collapse middle segments; ellipsize trailing link segments on narrow layouts. */
export function planBreadcrumbDisplay(
  items: BreadcrumbItem[],
  options?: BreadcrumbPlanOptions
): BreadcrumbPlanSegment[] {
  if (items.length === 0) {
    return [];
  }

  if (options?.trailEndsWithLink) {
    if (items.length === 1) {
      return [linkSegment(items[0], 0, true)];
    }
    const first = items[0];
    const last = items[items.length - 1];
    const middle = items.slice(1, -1);
    const segments: BreadcrumbPlanSegment[] = [linkSegment(first, 0, false)];
    if (middle.length > 0) {
      segments.push({ kind: 'collapsed', items: middle });
    }
    segments.push(linkSegment(last, items.length - 1, true));
    return segments;
  }

  if (items.length === 1) {
    const only = items[0];
    return [{ kind: 'current', index: 0, label: only.label }];
  }

  const lastIndex = items.length - 1;
  const penultimateIndex = items.length - 2;

  if (items.length === 2) {
    const first = items[0];
    const second = items[1];
    const segments: BreadcrumbPlanSegment[] = [linkSegment(first, 0, true)];
    segments.push({ kind: 'current', index: 1, label: second.label });
    return segments;
  }

  const first = items[0];
  const current = items[lastIndex];
  const segments: BreadcrumbPlanSegment[] = [linkSegment(first, 0, false)];

  if (items.length === 3) {
    segments.push({ kind: 'collapsed', items: items.slice(1, 2) });
    segments.push({ kind: 'current', index: lastIndex, label: current.label });
    return segments;
  }

  const penultimate = items[penultimateIndex];
  const middle = items.slice(1, penultimateIndex);
  if (middle.length > 0) {
    segments.push({ kind: 'collapsed', items: middle });
  }
  segments.push(linkSegment(penultimate, penultimateIndex, true));
  segments.push({ kind: 'current', index: lastIndex, label: current.label });
  return segments;
}
