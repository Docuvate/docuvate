// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentLayoutTokensResponse, LayoutToken } from '@docuvate/contracts';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from './api';
import { useDocumentRegionLayers } from './useDocumentRegionLayers';

vi.mock('./api', () => ({
  listDocumentLayoutTokens: vi.fn(),
  listDocumentRegions: vi.fn(() => Promise.resolve({ items: [] })),
}));

function token(text: string): LayoutToken {
  return { blockIndex: 0, page: 1, text, x0: 0.1, y0: 0.1, x1: 0.3, y1: 0.12 };
}

function tokenPage(page: number, tokens: LayoutToken[]): DocumentLayoutTokensResponse {
  return { page, irSha256: 'sha', tokens };
}

describe('useDocumentRegionLayers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reloads tokens when the layout IR revision changes (reprocess finished)', async () => {
    vi.mocked(api.listDocumentLayoutTokens)
      .mockResolvedValueOnce(tokenPage(1, []))
      .mockResolvedValueOnce(tokenPage(1, [token('Rentenbeiträge')]));
    const { result, rerender } = renderHook(
      ({ revision }: { revision: string }) => useDocumentRegionLayers('doc-1', 1, revision),
      { initialProps: { revision: 'processing:t0:no-ir' } }
    );
    await waitFor(() => {
      expect(api.listDocumentLayoutTokens).toHaveBeenCalledTimes(1);
    });
    expect(result.current.layoutTokens).toEqual([]);

    rerender({ revision: 'ready:t1:ir' });
    await waitFor(() => {
      expect(result.current.layoutTokens).toEqual([token('Rentenbeiträge')]);
    });
    expect(api.listDocumentLayoutTokens).toHaveBeenCalledTimes(2);
  });

  it('drops a superseded page response that resolves after the newer one', async () => {
    let resolvePageOne: (value: DocumentLayoutTokensResponse) => void = () => undefined;
    vi.mocked(api.listDocumentLayoutTokens).mockImplementation((_id: string, page?: number) =>
      page === 1
        ? new Promise<DocumentLayoutTokensResponse>((resolve) => {
            resolvePageOne = resolve;
          })
        : Promise.resolve(tokenPage(2, [token('page-two')]))
    );
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useDocumentRegionLayers('doc-1', page, 'ready:t1:ir'),
      { initialProps: { page: 1 } }
    );
    rerender({ page: 2 });
    await waitFor(() => {
      expect(result.current.layoutTokens).toEqual([token('page-two')]);
    });

    resolvePageOne(tokenPage(1, [token('page-one')]));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.layoutTokens).toEqual([token('page-two')]);
  });
});
