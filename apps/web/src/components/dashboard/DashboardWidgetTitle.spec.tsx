// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardWidgetTitle } from './DashboardWidgetTitle';

describe('DashboardWidgetTitle', () => {
  it('sets title attribute when text is truncated', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = disconnect;
      }
    );

    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return 400;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 120;
      },
    });

    render(<DashboardWidgetTitle title="A very long dashboard widget title that should truncate" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.getAttribute('title')).toBe('A very long dashboard widget title that should truncate');
  });
});
