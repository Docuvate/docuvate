// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { describe, expect, it } from 'vitest';

import { planBreadcrumbDisplay } from './breadcrumbDisplayPlan';

describe('planBreadcrumbDisplay', () => {
  it('returns empty for no items', () => {
    expect(planBreadcrumbDisplay([])).toEqual([]);
  });

  it('marks a single item as current', () => {
    expect(planBreadcrumbDisplay([{ label: 'Root' }])).toEqual([
      { kind: 'current', index: 0, label: 'Root' },
    ]);
  });

  it('ellipsizes the first link when two items', () => {
    expect(
      planBreadcrumbDisplay([
        { label: 'A', to: '/a' },
        { label: 'B' },
      ])
    ).toEqual([
      { kind: 'link', index: 0, label: 'A', to: '/a', ellipsis: true },
      { kind: 'current', index: 1, label: 'B' },
    ]);
  });

  it('collapses the middle segment when three items', () => {
    expect(
      planBreadcrumbDisplay([
        { label: 'A', to: '/a' },
        { label: 'B', to: '/b' },
        { label: 'C' },
      ])
    ).toEqual([
      { kind: 'link', index: 0, label: 'A', to: '/a', ellipsis: false },
      { kind: 'collapsed', items: [{ label: 'B', to: '/b' }] },
      { kind: 'current', index: 2, label: 'C' },
    ]);
  });

  it('collapses middle segments when more than three items', () => {
    expect(
      planBreadcrumbDisplay([
        { label: 'All', to: '/all' },
        { label: 'Root', to: '/root' },
        { label: 'Workstream', to: '/ws' },
        { label: 'Deep' },
      ])
    ).toEqual([
      { kind: 'link', index: 0, label: 'All', to: '/all', ellipsis: false },
      {
        kind: 'collapsed',
        items: [{ label: 'Root', to: '/root' }],
      },
      { kind: 'link', index: 2, label: 'Workstream', to: '/ws', ellipsis: true },
      { kind: 'current', index: 3, label: 'Deep' },
    ]);
  });

  it('trail mode: first, collapsed middle, ellipsized parent link', () => {
    expect(
      planBreadcrumbDisplay(
        [
          { label: 'All', to: '/all' },
          { label: 'Root', to: '/root' },
          { label: 'Parent', to: '/parent' },
        ],
        { trailEndsWithLink: true }
      )
    ).toEqual([
      { kind: 'link', index: 0, label: 'All', to: '/all', ellipsis: false },
      { kind: 'collapsed', items: [{ label: 'Root', to: '/root' }] },
      { kind: 'link', index: 2, label: 'Parent', to: '/parent', ellipsis: true },
    ]);
  });
});
