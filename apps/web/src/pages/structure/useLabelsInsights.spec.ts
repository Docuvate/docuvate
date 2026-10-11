// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { useLabelsInsights } from './useLabelsInsights';

describe('useLabelsInsights', () => {
  it('load does not retrigger in a loop when called from a stable effect', async () => {
    const listLabelRecommendations = vi.spyOn(api, 'listLabelRecommendations').mockResolvedValue([]);
    const listDocuments = vi.spyOn(api, 'listDocuments').mockResolvedValue([]);
    const getLabelMap = vi.spyOn(api, 'getLabelMap').mockResolvedValue({
      coverageSummary: null,
      emptyReason: null,
      extractedDocumentCount: 0,
      nodes: [],
      edges: [],
    });

    const onReloadTags = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useLabelsInsights(onReloadTags));

    await result.current.load();
    await waitFor(() => { expect(result.current.loading).toBe(false); });

    expect(listLabelRecommendations).toHaveBeenCalledTimes(1);
    expect(listDocuments).toHaveBeenCalledTimes(1);
    expect(getLabelMap).toHaveBeenCalledTimes(1);

    listLabelRecommendations.mockClear();
    listDocuments.mockClear();
    getLabelMap.mockClear();

    await result.current.load();
    expect(listLabelRecommendations).toHaveBeenCalledTimes(1);
    expect(listDocuments).toHaveBeenCalledTimes(1);
    expect(getLabelMap).toHaveBeenCalledTimes(1);
  });
});
