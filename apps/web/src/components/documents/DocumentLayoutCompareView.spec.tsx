// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de' },
  }),
}));

vi.mock('../../lib/useLayoutCompare', () => ({
  useLayoutCompare: () => ({
    summary: { category: 'born_digital_standard', ssimFloor: 0.97, pageCount: 3 },
    summaryState: 'ready',
    summaryError: null,
    metrics: { category: 'born_digital_standard', ssimFloor: 0.97, pageCount: 3, pages: [] },
    metricsState: 'ready',
    metricsError: null,
    metricsByPage: new Map(),
    pagePayload: {
      pageNumber: 2,
      ssim: 0.99,
      inkDeviation: 0.01,
      ssimFloor: 0.97,
      pageReliable: true,
      widthPx: 100,
      heightPx: 100,
      originalPngBase64: 'aW1n',
      reconstructionPngBase64: 'aW1n',
      heatmapPngBase64: null,
      errorCode: null,
    },
    pageState: 'ready',
    pageError: null,
    loadPage: vi.fn(),
  }),
}));

import { DocumentLayoutCompareView } from './DocumentLayoutCompareView';

describe('DocumentLayoutCompareView', () => {
  it('changes page with arrow keys on the compare root', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <DocumentLayoutCompareView
        documentId="doc-1"
        pageCount={5}
        activePage={2}
        onPageChange={onPageChange}
      />
    );
    const toolbar = container.querySelector('.layout-compare-toolbar');
    if (!(toolbar instanceof HTMLElement)) {
      throw new Error('layout compare toolbar not found');
    }
    toolbar.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
