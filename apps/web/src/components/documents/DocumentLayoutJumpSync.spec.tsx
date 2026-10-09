// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';

vi.mock('../../lib/api', () => ({
  fetchDocumentLayoutTypst: vi.fn(),
}));

vi.mock('./PdfViewer', () => ({
  PdfViewer: ({
    onLayoutOverlaySelect,
  }: {
    onLayoutOverlaySelect?: (id: string) => void;
  }) => (
    <button type="button" onClick={() => onLayoutOverlaySelect?.('table-0')}>
      mock-overlay
    </button>
  ),
}));

vi.mock('./ExtractedLayoutHtmlFrame', () => ({
  ExtractedLayoutHtmlFrame: () => null,
  LAYOUT_IR_ZOOM_STEPS: [75, 100, 125],
}));

vi.mock('../../lib/useDocumentLayoutIr', () => ({
  useDocumentLayoutIr: () => ({
    layoutIr: null,
    state: 'ready',
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'documents.layoutTableLabel' && opts && 'n' in opts) {
        return `Table ${opts.n}`;
      }
      return key;
    },
  }),
}));

import { DocumentLayoutSidePanel } from './DocumentLayoutSidePanel';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [
    {
      page: 2,
      widthPt: 595,
      heightPt: 842,
      blocks: [
        {
          page: 2,
          x: 0.1,
          y: 0.1,
          width: 0.5,
          height: 0.04,
          text: 'Section',
          fontSizePt: 13,
          weight: 'bold',
          blockIndex: 0,
        },
      ],
      tables: [
        {
          page: 2,
          x: 0.1,
          y: 0.3,
          width: 0.8,
          height: 0.2,
          columnCount: 1,
          rows: [[{ text: 'A', x: 0, y: 0, width: 0.1, height: 0.02 }]],
        },
      ],
      widgets: [],
    },
  ],
};

describe('Document layout jump sync', () => {
  afterEach(() => cleanup());
  it('scrolls PDF page when outline entry is activated', () => {
    const onOverlaySelect = vi.fn();
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[]}
        blocks={[]}
        knownFieldKeys={new Set()}
        fieldLabelForKey={(k) => k}
        activeTab="outline"
        onTabChange={() => {}}
        activeOverlayId={null}
        onOverlaySelect={onOverlaySelect}
        onAcceptSuggestion={() => {}}
        onDismissSuggestion={() => {}}
        dismissedSuggestions={new Set()}
      />
    );
    const outlineBtn = screen.getByText('Section');
    fireEvent.click(outlineBtn);
    expect(onOverlaySelect).toHaveBeenCalled();
    const [, page] = onOverlaySelect.mock.calls[0];
    expect(page).toBe(2);
  });

  it('moves focus across tabs with arrow keys', () => {
    const onTabChange = vi.fn();
    render(
      <DocumentLayoutSidePanel
        documentId="doc-1"
        layoutIr={layoutIr}
        fields={[]}
        blocks={[]}
        knownFieldKeys={new Set()}
        fieldLabelForKey={(k) => k}
        activeTab="fields"
        onTabChange={onTabChange}
        activeOverlayId={null}
        onOverlaySelect={() => {}}
        onAcceptSuggestion={() => {}}
        onDismissSuggestion={() => {}}
        dismissedSuggestions={new Set()}
      />
    );
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith('tables');
  });
});
