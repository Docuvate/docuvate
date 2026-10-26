// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { useDocumentsInfiniteQuery } from '../../lib/documents/useDocumentsInfiniteQuery';

describe('useDocumentsInfiniteQuery', () => {
  const listDocumentsPage = vi.spyOn(api, 'listDocumentsPage');

  beforeEach(() => {
    listDocumentsPage.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    });
  });

  afterEach(() => {
    listDocumentsPage.mockRestore();
  });

  it('fetches the document list once per stable filter set', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const filters = { sort: 'updatedAt' as const, order: 'desc' as const };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { rerender } = renderHook(() => useDocumentsInfiniteQuery(filters), { wrapper });
    await waitFor(() => {
      expect(listDocumentsPage).toHaveBeenCalledTimes(1);
    });

    rerender();
    rerender();
    await waitFor(() => {
      expect(listDocumentsPage).toHaveBeenCalledTimes(1);
    });
  });
});
