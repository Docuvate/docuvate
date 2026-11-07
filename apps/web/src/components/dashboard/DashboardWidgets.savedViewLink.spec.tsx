// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DashboardWidgetDto, SavedDocumentViewDto } from '@docuvate/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { DashboardWidgets } from './DashboardWidgets';

vi.mock('../../lib/api', () => ({
  getDashboardWidgetDocumentPreviews: vi.fn(() =>
    Promise.resolve({ items: [], attentionCount: 0 })
  ),
}));

const savedView: SavedDocumentViewDto = {
  id: 'view-lease',
  name: 'Lease files',
  ownerUserId: 'user-1',
  visibility: 'private',
  searchQuery: '',
  sort: 'updatedAt',
  order: 'desc',
  viewMode: 'klassisch',
  filterMode: 'ui',
  listScope: 'all',
  tagIds: [],
  status: null,
  inbox: null,
  withoutNonInboxLabel: null,
  folderId: null,
  fieldFilters: [],
  documentDateFrom: null,
  documentDateTo: null,
  pinnedSidebar: true,
  visibleColumns: ['title', 'labels', 'date', 'status'],
  position: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function widget(
  partial: Pick<DashboardWidgetDto, 'id' | 'type' | 'savedViewId'>
): DashboardWidgetDto {
  return {
    position: 0,
    widthCols: 6,
    heightRows: 2,
    itemLimit: 5,
    ...partial,
  };
}

function renderWidgets(widgets: DashboardWidgetDto[]) {
  return render(
    <MemoryRouter>
      <DashboardWidgets
        widgets={widgets}
        editMode={false}
        onWidgetsChange={() => undefined}
        savedViews={[savedView]}
        statistics={null}
      />
    </MemoryRouter>
  );
}

describe('dashboard saved-view navigation', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {
          return undefined;
        }
        disconnect() {
          return undefined;
        }
      }
    );
  });

  it('opens the saved view from the widget instead of the unfiltered library', () => {
    renderWidgets([widget({ id: 'w-saved', type: 'saved_view', savedViewId: savedView.id })]);
    const link = screen.getByRole('link', { name: /view all|alle anzeigen/i });
    expect(link.getAttribute('href')).toBe('/documents?view=view-lease');
  });

  it('keeps recent documents on the full library', () => {
    renderWidgets([widget({ id: 'w-recent', type: 'recent_documents', savedViewId: null })]);
    const link = screen.getByRole('link', { name: /view all|alle anzeigen/i });
    expect(link.getAttribute('href')).toBe('/documents');
  });
});
