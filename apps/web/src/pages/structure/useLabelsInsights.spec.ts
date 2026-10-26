// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { act,renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLabelsInsights } from './useLabelsInsights';

vi.mock('../../lib/api', () => ({
  listLabelRecommendations: vi.fn(() => Promise.resolve({ items: [], state: 'ready' })),
  getLabelDocumentInventorySummary: vi.fn(() =>
    Promise.resolve({
      inventory: { total: 0, labeled: 0, unlabeled: 0 },
      documentCountByTagId: {},
    })
  ),
  getLabelMap: vi.fn(() =>
    Promise.resolve({ coverageSummary: null, emptyReason: null, extractedDocumentCount: 0 })
  ),
  acceptLabelRecommendation: vi.fn(() => Promise.resolve({ tagId: 't1', action: 'assigned' })),
  dismissLabelRecommendation: vi.fn(() => Promise.resolve(undefined)),
  getDocumentReviewQueueSummary: vi.fn(() => Promise.resolve({ pendingCount: 0 })),
}));

describe('useLabelsInsights', () => {
  it('records recommendations errors separately from map errors', async () => {
    const api = await import('../../lib/api');
    vi.mocked(api.listLabelRecommendations).mockRejectedValueOnce(new Error('boom'));
    const onReloadTags = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useLabelsInsights(onReloadTags));

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.recommendationsError).toBeTruthy();
    expect(result.current.queueItems).toEqual([]);
  });

  it('accept refreshes silently without toggling loading', async () => {
    const onReloadTags = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useLabelsInsights(onReloadTags));

    await act(async () => {
      await result.current.load();
    });
    expect(result.current.loading).toBe(false);

    const item = {
      id: 'assign:1',
      kind: 'assign' as const,
      tagId: 'tag-1',
      tagNames: ['Tax'],
    };

    await act(async () => {
      await result.current.accept(item);
    });

    expect(onReloadTags).toHaveBeenCalledWith({ silent: true });
    expect(result.current.loading).toBe(false);
  });
});
