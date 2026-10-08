/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NARROW_VIEWPORT_MAX_WIDTH_PX,
  NARROW_VIEWPORT_MEDIA_QUERY,
  readNarrowViewport,
} from './narrowViewport';

function mockViewportWidth(widthPx: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => {
      const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      const matches =
        maxMatch !== null ? widthPx <= Number(maxMatch[1]) : query === NARROW_VIEWPORT_MEDIA_QUERY;
      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList;
    }),
  });
}

describe('readNarrowViewport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the 768px narrow breakpoint constant', () => {
    expect(NARROW_VIEWPORT_MEDIA_QUERY).toBe(`(max-width: ${NARROW_VIEWPORT_MAX_WIDTH_PX}px)`);
  });

  it('is narrow at 430px and 768px', () => {
    mockViewportWidth(430);
    expect(readNarrowViewport()).toBe(true);
    mockViewportWidth(768);
    expect(readNarrowViewport()).toBe(true);
  });

  it('is not narrow at 769px', () => {
    mockViewportWidth(769);
    expect(readNarrowViewport()).toBe(false);
  });
});
