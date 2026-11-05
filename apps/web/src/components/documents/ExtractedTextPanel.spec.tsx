// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument, LayoutIrPage } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, opts?: { page?: number; total?: number }) =>
      opts?.page === undefined
        ? key
        : `${key}:${String(opts.page)}${opts.total === undefined ? '' : `/${String(opts.total)}`}`,
    i18n: { language: 'de' },
  }),
}));

vi.mock('../save', () => ({
  useToastNotify: () => ({ pushError: vi.fn(), pushSuccess: vi.fn() }),
}));

vi.mock('../../lib/useNarrowTopbar', () => ({
  useNarrowTopbar: () => false,
}));

import { ExtractedTextPanel } from './ExtractedTextPanel';

function irPage(page: number, text: string | null): LayoutIrPage {
  return {
    page,
    widthPt: 595,
    heightPt: 842,
    blocks: text === null ? [] : [{ page, x: 0.1, y: 0.1, width: 0.6, height: 0.04, text }],
  };
}

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [irPage(1, 'Synthetic page one'), irPage(2, null), irPage(3, 'Synthetic page three')],
};

function renderPanel(activePage: number, onActivePageChange = vi.fn()) {
  return render(
    <ExtractedTextPanel
      documentId="doc-1"
      fullText="Synthetic page one Synthetic page three"
      layoutIrAvailable
      layoutIrDocument={layoutIr}
      layoutIrPages={layoutIr.pages.map((p) => ({ page: p.page, widthPt: 595, heightPt: 842 }))}
      blocks={[]}
      activePage={activePage}
      activeBlockIndex={null}
      pageSynced
      onActivePageChange={onActivePageChange}
      onHighlightBlocks={vi.fn()}
      onBlocksChange={vi.fn()}
      onActiveBlockIndexChange={vi.fn()}
      textOnly
    />
  );
}

describe('ExtractedTextPanel text view', () => {
  it('renders the active page text from the layout IR when extraction blocks are empty', () => {
    const { container } = renderPanel(3);
    const sections = container.querySelectorAll('.extracted-text-body section[data-page]');
    expect(sections).toHaveLength(1);
    expect(sections.item(0).getAttribute('data-page')).toBe('3');
    expect(screen.getByText('Synthetic page three')).toBeTruthy();
    expect(screen.queryByText('Synthetic page one')).toBeNull();
  });

  it('explains a page without recognised text instead of rendering an empty pane', () => {
    renderPanel(2);
    expect(screen.getByText('documents.extractedTextPageEmpty:2')).toBeTruthy();
  });

  it('pages through the text with prev/next', () => {
    const onActivePageChange = vi.fn();
    renderPanel(1, onActivePageChange);
    expect(screen.getByText('documents.extractedTextPageOf:1/3')).toBeTruthy();
    const prev = screen.getByRole('button', { name: 'documents.extractedTextPagePrev' });
    expect(prev).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('button', { name: 'documents.extractedTextPageNext' }));
    expect(onActivePageChange).toHaveBeenCalledWith(2);
  });

  it('highlights reading paragraphs that match the search', () => {
    const { container } = renderPanel(1);
    fireEvent.change(
      screen.getByRole('textbox', { name: 'documents.extractedTextSearchPlaceholder' }),
      {
        target: { value: 'page one' },
      }
    );
    expect(container.querySelectorAll('.extracted-text-line-search-hit')).toHaveLength(1);
  });
});
