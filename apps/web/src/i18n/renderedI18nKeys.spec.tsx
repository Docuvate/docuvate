/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LibraryPageDocumentSection } from '../pages/library/LibraryPageDocumentSection';

const RAW_KEY = /^[a-z][a-z0-9]*(\.[a-zA-Z0-9]+)+$/;

function collectRawKeys(container: HTMLElement): string[] {
  const hits: string[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.textContent?.trim() ?? '';
    if (text && RAW_KEY.test(text)) {
      hits.push(text);
    }
    node = walker.nextNode();
  }
  return hits;
}

describe('rendered i18n keys', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('library toolbar does not render unresolved translation keys', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    const data = {
      loading: false,
      error: null,
      items: [],
      query: '',
      setQuery: () => undefined,
      onSearch: async (e: { preventDefault: () => void }) => e.preventDefault(),
      viewMode: 'klassisch' as const,
      onViewModeChange: () => undefined,
      filters: { sort: 'updatedAt' as const, order: 'desc' as const },
      onSortChange: () => undefined,
      visibleSelectedCount: 0,
      selected: new Set<string>(),
      toggleSelect: () => undefined,
      toggleSelectAll: () => undefined,
      onSort: () => undefined,
      refresh: () => undefined,
    };
    const ctx = {
      contextMenu: null,
      closeContextMenu: () => undefined,
      openContextMenu: () => undefined,
      contextMenuItems: [],
      duplicateReview: null,
      closeDuplicateReview: () => undefined,
      bulkDeleteOpen: false,
      setBulkDeleteOpen: () => undefined,
      confirmBulkDelete: async () => undefined,
      bulkDeleteBusy: false,
    };

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <LibraryPageDocumentSection
          data={data as never}
          ctx={ctx as never}
          filterToggle={{ expanded: false, activeCount: 0, onToggle: () => undefined }}
        />
      </I18nextProvider>
    );

    expect(screen.getByRole('button', { name: /Filter/i })).toBeTruthy();
    const raw = collectRawKeys(container);
    expect(raw).toEqual([]);
  });
});
