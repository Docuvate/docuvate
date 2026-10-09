// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import { routes } from './routes';
import { savedViewSidebarLinkIsActive } from './savedViewSidebarNav';

describe('savedViewSidebarLinkIsActive', () => {
  const viewA = 'd721ec53-a5cc-45f9-bc00-d199e9fa3e33';
  const viewB = '73b9b78f-1e44-455e-9e5f-ac112d53360a';

  it('matches only the view id in the query on /documents', () => {
    const search = `?view=${viewA}&sort=date`;
    expect(savedViewSidebarLinkIsActive(routes.documents, search, viewA)).toBe(true);
    expect(savedViewSidebarLinkIsActive(routes.documents, search, viewB)).toBe(false);
  });

  it('is false without a view param', () => {
    expect(savedViewSidebarLinkIsActive(routes.documents, '', viewA)).toBe(false);
    expect(savedViewSidebarLinkIsActive(routes.documents, '?sort=date', viewA)).toBe(false);
  });

  it('is false on other routes', () => {
    expect(savedViewSidebarLinkIsActive(routes.savedViews, `?view=${viewA}`, viewA)).toBe(false);
    expect(savedViewSidebarLinkIsActive(routes.home, `?view=${viewA}`, viewA)).toBe(false);
  });
});
