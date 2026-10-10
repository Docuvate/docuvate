// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { page?: number; total?: number; start?: number; end?: number }) => {
      if (key === 'documents.layoutComparePageOf' && opts) {
        return `${opts.page}/${opts.total}`;
      }
      if (key === 'documents.layoutCompareVirtualHint' && opts) {
        return `${opts.start}-${opts.end}/${opts.total}`;
      }
      return key;
    },
    i18n: { language: 'de' },
  }),
}));

import { LayoutComparePageNav } from './LayoutComparePageNav';

describe('LayoutComparePageNav', () => {
  it('renders a bounded chip count for 120 pages', () => {
    render(
      <LayoutComparePageNav
        pageCount={120}
        activePage={60}
        metricsByPage={new Map()}
        onPageChange={vi.fn()}
      />
    );
    const chips = screen.getAllByRole('option');
    expect(chips.length).toBe(21);
    expect(chips.length).toBeLessThan(30);
  });
});
