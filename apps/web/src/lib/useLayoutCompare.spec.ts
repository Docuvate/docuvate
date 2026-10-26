// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from './api';
import { useLayoutCompare } from './useLayoutCompare';

vi.mock('./api', () => ({
  fetchDocumentLayoutCompareSummary: vi.fn(() => Promise.resolve({ pageCount: 1, category: '', ssimFloor: 0.96 })),
  fetchDocumentLayoutCompareMetrics: vi.fn(() =>
    Promise.resolve({ pageCount: 1, category: '', ssimFloor: 0.96, pages: [] })
  ),
  fetchDocumentLayoutComparePage: vi.fn(() =>
    Promise.resolve({
      pageNumber: 1,
      originalUrl: '/o.png',
      reconstructionUrl: '/r.png',
      heatmapUrl: null,
    })
  ),
}));

describe('useLayoutCompare', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch layout compare pages when disabled', async () => {
    renderHook(() => useLayoutCompare('doc-1', false, 2, 1, false));

    await waitFor(() => {
      expect(api.fetchDocumentLayoutCompareSummary).not.toHaveBeenCalled();
      expect(api.fetchDocumentLayoutComparePage).not.toHaveBeenCalled();
    });
  });

  it('fetches summary when enabled', async () => {
    renderHook(() => useLayoutCompare('doc-2', true, 2, 1, false));

    await waitFor(() => {
      expect(api.fetchDocumentLayoutCompareSummary).toHaveBeenCalled();
    });
  });
});
