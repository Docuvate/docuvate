// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { page?: number; total?: number; start?: number; end?: number }) => {
      if (key === 'documents.layoutComparePageOf' && opts) {
        return `${String(opts.page)}/${String(opts.total)}`;
      }
      if (key === 'documents.layoutCompareVirtualHint' && opts) {
        return `${String(opts.start)}-${String(opts.end)}/${String(opts.total)}`;
      }
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

import { LayoutComparePageNav } from './LayoutComparePageNav';

describe('LayoutComparePageNav', () => {
  it('virtualizes the page strip for a 16-page paper', () => {
    render(
      <LayoutComparePageNav
        pageCount={16}
        activePage={8}
        metricsByPage={new Map()}
        onPageChange={vi.fn()}
      />
    );
    const chips = document.querySelectorAll('.layout-compare-page-chip');
    expect(chips.length).toBe(16);
    expect(screen.getByText('1-16/16')).toBeTruthy();
  });

  it('renders a bounded chip count for 120 pages', () => {
    render(
      <LayoutComparePageNav
        pageCount={120}
        activePage={60}
        metricsByPage={new Map()}
        onPageChange={vi.fn()}
      />
    );
    const chips = document.querySelectorAll('.layout-compare-page-chip');
    expect(chips.length).toBe(21);
    expect(chips.length).toBeLessThan(30);
  });
});
