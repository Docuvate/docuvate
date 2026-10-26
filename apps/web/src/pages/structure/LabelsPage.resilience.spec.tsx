// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { LabelsPage } from './LabelsPage';

const api = vi.hoisted(() => ({
  listTags: vi.fn(),
  listLabelRecommendations: vi.fn(),
  getLabelDocumentInventorySummary: vi.fn(),
  getLabelMap: vi.fn(),
  getDocumentReviewQueueSummary: vi.fn(),
  searchTagsPage: vi.fn(),
}));

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>();
  return { ...actual, ...api };
});

vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: {
        session: { id: 'session-1' },
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      },
      isPending: false,
      error: null,
    })),
  },
  authSessionUserId: () => 'user-1',
}));

vi.mock('../../components/save/ToastProvider', () => ({
  useToastNotify: () => ({ pushSuccess: vi.fn(), pushError: vi.fn() }),
}));

describe('LabelsPage resilience', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    api.listTags.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'Invoices',
        color: '#64748b',
        isInbox: false,
        matchingAlgorithm: 'none',
        match: '',
      },
    ]);
    api.listLabelRecommendations.mockRejectedValue(new Error('recommendations down'));
    api.getLabelDocumentInventorySummary.mockResolvedValue({
      inventory: { total: 0, labeled: 0, unlabeled: 0 },
      documentCountByTagId: {},
    });
    api.getLabelMap.mockResolvedValue({
      coverageSummary: null,
      emptyReason: null,
      extractedDocumentCount: 0,
    });
    api.getDocumentReviewQueueSummary.mockResolvedValue({ pendingCount: 0 });
    api.searchTagsPage.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('still renders the vocabulary list when recommendations fail', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LabelsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });
});
