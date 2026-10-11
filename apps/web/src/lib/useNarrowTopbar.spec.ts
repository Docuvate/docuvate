// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NARROW_VIEWPORT_MEDIA_QUERY } from './narrowViewport';
import { useNarrowTopbar } from './useNarrowTopbar';

function mockViewportWidth(widthPx: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => {
      const maxMatch = /\(max-width:\s*(\d+)px\)/.exec(query);
      const matches =
        maxMatch !== null ? widthPx <= Number(maxMatch[1]) : query === NARROW_VIEWPORT_MEDIA_QUERY;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } satisfies MediaQueryList;
    }),
  });
}

describe('useNarrowTopbar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is true at 430px and 768px, false at 769px', () => {
    mockViewportWidth(430);
    const at430 = renderHook(() => useNarrowTopbar());
    expect(at430.result.current).toBe(true);
    at430.unmount();

    mockViewportWidth(768);
    const at768 = renderHook(() => useNarrowTopbar());
    expect(at768.result.current).toBe(true);
    at768.unmount();

    mockViewportWidth(769);
    const at769 = renderHook(() => useNarrowTopbar());
    expect(at769.result.current).toBe(false);
  });
});
