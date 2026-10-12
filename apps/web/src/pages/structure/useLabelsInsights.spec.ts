// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLabelsInsights } from './useLabelsInsights';

vi.mock('../../lib/api', () => ({
  listLabelRecommendations: vi.fn(async () => []),
  listDocuments: vi.fn(async () => []),
  getLabelMap: vi.fn(async () => ({ coverageSummary: null, emptyReason: null, extractedDocumentCount: 0 })),
  acceptLabelRecommendation: vi.fn(async () => ({ tagId: 't1', action: 'assigned' })),
  dismissLabelRecommendation: vi.fn(async () => undefined),
}));

describe('useLabelsInsights', () => {
  it('accept refreshes silently without toggling loading', async () => {
    const onReloadTags = vi.fn(async () => undefined);
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
