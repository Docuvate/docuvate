// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock, LayoutIrDocument, LayoutIrPage } from '@docuvate/contracts';
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

  it('edits worker extraction blocks when layout IR has merged them into one paragraph', () => {
    const blocks: ExtractionBlock[] = [
      { page: 1, x: 0.121, y: 0.123, width: 0.2, height: 0.021, text: 'NORTH 1842', blockIndex: 0 },
      { page: 1, x: 0.121, y: 0.171, width: 0.28, height: 0.021, text: 'INVOICE TOTAL', blockIndex: 1 },
    ];
    const ir: LayoutIrDocument = {
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [],
          lines: [
            { page: 1, x: 0.121, y: 0.123, width: 0.2, height: 0.021, text: 'NORTH 1842', blockIndex: 0 },
            { page: 1, x: 0.121, y: 0.171, width: 0.28, height: 0.021, text: 'INVOICE TOTAL', blockIndex: 1 },
          ],
        },
      ],
    };
    const onBlocksChange = vi.fn();
    const { container, rerender } = render(
      <ExtractedTextPanel
        documentId="doc-real-ocr"
        fullText="NORTH 1842\nINVOICE TOTAL"
        layoutIrAvailable
        layoutIrDocument={ir}
        blocks={blocks}
        activePage={1}
        activeBlockIndex={null}
        pageSynced
        editMode={false}
        textOnly
        onActivePageChange={vi.fn()}
        onHighlightBlocks={vi.fn()}
        onBlocksChange={onBlocksChange}
        onActiveBlockIndexChange={vi.fn()}
      />
    );
    expect(container.querySelectorAll('.extracted-text-reading-paragraph')).toHaveLength(1);
    expect(screen.getByText('NORTH 1842 INVOICE TOTAL')).toBeTruthy();
    expect(container.querySelector('.extracted-text-segment')).toBeNull();

    rerender(
      <ExtractedTextPanel
        documentId="doc-real-ocr"
        fullText="NORTH 1842\nINVOICE TOTAL"
        layoutIrAvailable
        layoutIrDocument={ir}
        blocks={blocks}
        activePage={1}
        activeBlockIndex={null}
        pageSynced
        editMode
        textOnly
        onActivePageChange={vi.fn()}
        onHighlightBlocks={vi.fn()}
        onBlocksChange={onBlocksChange}
        onActiveBlockIndexChange={vi.fn()}
      />
    );
    expect(container.querySelector('.extracted-text-reading-paragraph')).toBeNull();
    const segment = screen.getByText('NORTH 1842');
    fireEvent.doubleClick(segment);
    const input = screen.getByRole('textbox', { name: 'documents.extractedTextEditBlockAria' });
    fireEvent.change(input, { target: { value: 'NORTH 1842 korrigiert' } });
    expect(onBlocksChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ text: 'NORTH 1842 korrigiert', blockIndex: 0 }),
        expect.objectContaining({ text: 'INVOICE TOTAL', blockIndex: 1 }),
      ])
    );
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
