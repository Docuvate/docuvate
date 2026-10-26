// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { LabelsPage } from './LabelsPage';

const api = vi.hoisted(() => ({
  listTags: vi.fn(),
  listLabelRecommendations: vi.fn(),
  listDocuments: vi.fn(),
  getLabelMap: vi.fn(),
  getDocumentReviewQueueSummary: vi.fn(),
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
    api.listDocuments.mockResolvedValue([]);
    api.getLabelMap.mockResolvedValue({
      coverageSummary: null,
      emptyReason: null,
      extractedDocumentCount: 0,
    });
    api.getDocumentReviewQueueSummary.mockResolvedValue({ pendingCount: 0 });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('still renders the vocabulary list when recommendations fail', async () => {
    render(
      <MemoryRouter>
        <LabelsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeTruthy();
    });
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
