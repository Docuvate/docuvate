// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import { ExtractedLayoutHtmlFrame } from './ExtractedLayoutHtmlFrame';

vi.mock('../../lib/api', () => ({
  fetchDocumentLayoutHtml: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'documents.layoutReconstructionUnreliable'
        ? 'Reconstruction may not match the original reliably.'
        : key,
  }),
}));

import { fetchDocumentLayoutHtml } from '../../lib/api';

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [{ page: 1, widthPt: 595, heightPt: 842, blocks: [] }],
};

describe('ExtractedLayoutHtmlFrame', () => {
  beforeEach(() => {
    vi.mocked(fetchDocumentLayoutHtml).mockReset();
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows unreliable banner when API marks reconstruction as not reliable', async () => {
    vi.mocked(fetchDocumentLayoutHtml).mockResolvedValue({
      html: '<html><body><div class="page" data-page="1"></div></body></html>',
      reconstructionReliable: false,
      unreliableReason: 'unsupported_script',
    });

    render(
      <ExtractedLayoutHtmlFrame
        documentId="doc-1"
        layoutIr={layoutIr}
        activePage={1}
        pageSynced
        pageCount={1}
        zoom={100}
      />
    );

    await waitFor(() => {
      const banner = screen.getByRole('status');
      expect(banner.textContent).toContain('Reconstruction may not match the original reliably.');
    });
  });
});
