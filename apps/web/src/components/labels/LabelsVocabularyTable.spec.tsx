// @vitest-environment jsdom
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const searchState = vi.hoisted(() => {
  const tags: {
    id: string;
    name: string;
    color?: string;
    isInbox: boolean;
    matchingAlgorithm?: string;
    match?: string;
  }[] = [];
  return {
    query: '',
    enabled: false,
    tags,
    isFetching: false,
    isError: false,
  };
});

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string | number>) => {
        if (key === 'labels.vocabularyFilterEmpty' && options?.query != null) {
          return `empty:${String(options.query)}`;
        }
        if (key === 'labels.vocabularyDocCount') {
          return `docs:${String(options?.count ?? 0)}`;
        }
        return key;
      },
      i18n: { language: 'de' },
    }),
  };
});

vi.mock('../../lib/labels/useTagSearchInfiniteQuery', () => ({
  flattenTagSearchPages: () => ({
    tags: searchState.tags,
    hasMore: false,
    total: searchState.tags.length,
  }),
  useTagSearchInfiniteQuery: (query: string, enabled: boolean) => {
    searchState.query = query;
    searchState.enabled = enabled;
    return {
      data: {
        pages: [
          {
            items: searchState.tags,
            nextCursor: null,
            hasMore: false,
            total: searchState.tags.length,
          },
        ],
        pageParams: [undefined],
      },
      isFetching: searchState.isFetching,
      isError: searchState.isError,
    };
  },
}));

vi.mock('../../lib/useStackedTableLayout', () => ({
  useStackedTableLayout: () => false,
}));

import { LabelsVocabularyTable } from './LabelsVocabularyTable';

function tag(partial: Pick<TagDto, 'id' | 'name'> & Partial<TagDto>): TagDto {
  return {
    id: partial.id,
    name: partial.name,
    color: partial.color ?? '#64748b',
    isInbox: partial.isInbox ?? false,
    matchingAlgorithm: partial.matchingAlgorithm ?? 'none',
    match: partial.match ?? '',
  };
}

const ALL_TAGS: TagDto[] = [
  tag({ id: 't1', name: 'Steuer' }),
  tag({ id: 't2', name: 'zellbio' }),
  tag({ id: 't3', name: 'Rechnung' }),
  tag({ id: 't4', name: 'Photovoltaik' }),
  tag({ id: 'inbox', name: 'Inbox', isInbox: true }),
];

function renderTable(tags: TagDto[] = ALL_TAGS) {
  return render(
    <MemoryRouter>
      <LabelsVocabularyTable
        tags={tags}
        documentCountByTagId={{ t1: 2, t2: 5, t3: 1, t4: 0 }}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    </MemoryRouter>
  );
}

describe('LabelsVocabularyTable filter', () => {
  beforeEach(() => {
    searchState.query = '';
    searchState.enabled = false;
    searchState.tags = [];
    searchState.isFetching = false;
    searchState.isError = false;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('filters rows via the inline search field without a listbox overlay', async () => {
    searchState.tags = [tag({ id: 't1', name: 'Steuer' })];
    renderTable();

    expect(screen.getByText('Steuer')).toBeTruthy();
    expect(screen.getByText('zellbio')).toBeTruthy();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.querySelector('.label-picker-list')).toBeNull();

    const input = screen.getByTestId('labels-vocabulary-filter-input');
    fireEvent.change(input, { target: { value: 'Steuer' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(searchState.enabled).toBe(true);
      expect(searchState.query).toBe('Steuer');
      expect(screen.getByText('Steuer')).toBeTruthy();
      expect(screen.queryByText('zellbio')).toBeNull();
      expect(screen.queryByText('Rechnung')).toBeNull();
    });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('restores every vocabulary label when the filter is cleared', async () => {
    searchState.tags = [tag({ id: 't2', name: 'zellbio' })];
    renderTable();

    const input = screen.getByTestId('labels-vocabulary-filter-input');
    fireEvent.change(input, { target: { value: 'zellbio' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.queryByText('Steuer')).toBeNull();
      expect(screen.getByText('zellbio')).toBeTruthy();
    });

    searchState.tags = [];
    fireEvent.change(input, { target: { value: '' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(searchState.enabled).toBe(false);
      expect(screen.getByText('Steuer')).toBeTruthy();
      expect(screen.getByText('zellbio')).toBeTruthy();
      expect(screen.getByText('Rechnung')).toBeTruthy();
      expect(screen.getByText('Photovoltaik')).toBeTruthy();
      expect(screen.queryByText('Inbox')).toBeNull();
    });
  });

  it('shows a localized empty message when the search has no matches', async () => {
    searchState.tags = [];
    renderTable();

    const input = screen.getByTestId('labels-vocabulary-filter-input');
    fireEvent.change(input, { target: { value: 'xyzzy' } });
    await vi.advanceTimersByTimeAsync(250);

    await waitFor(() => {
      expect(screen.getByTestId('labels-vocabulary-filter-empty').textContent).toBe('empty:xyzzy');
      expect(screen.queryByText('Steuer')).toBeNull();
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });
});
