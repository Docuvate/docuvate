// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CURSOR_LIST_DEFAULT_LIMIT } from '@docuvate/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  flattenCursorPages,
  useCursorInfiniteQuery,
} from './useCursorInfiniteQuery';

describe('useCursorInfiniteQuery', () => {
  it('loads the first cursor page and flattens items', async () => {
    const fetchPage = vi.fn(() =>
      Promise.resolve({
      items: [{ id: 'a' }, { id: 'b' }],
      nextCursor: 'cursor-2',
      hasMore: true,
      total: 2,
      })
    );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCursorInfiniteQuery({
          queryKey: ['test-cursor'],
          extraParams: {},
          defaultLimit: CURSOR_LIST_DEFAULT_LIMIT,
          fetchPage,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchPage).toHaveBeenCalledWith({
      limit: CURSOR_LIST_DEFAULT_LIMIT,
      cursor: undefined,
    });
    expect(flattenCursorPages(result.current.data?.pages)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
