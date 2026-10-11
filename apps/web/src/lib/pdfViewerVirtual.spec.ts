// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  computeVirtualPageWindow,
  layoutOverlayPercentStyles,
  PDF_VIRTUAL_WINDOW_RADIUS,
} from './pdfViewerVirtual';

describe('pdfViewerVirtual', () => {
  it('windows visible pages with radius', () => {
    const window = computeVirtualPageWindow([10], 60, PDF_VIRTUAL_WINDOW_RADIUS);
    expect(window.has(8)).toBe(true);
    expect(window.has(10)).toBe(true);
    expect(window.has(12)).toBe(true);
    expect(window.has(7)).toBe(false);
    expect(window.has(13)).toBe(false);
  });

  it('bounds render window for a 60-page document', () => {
    const window = computeVirtualPageWindow([30], 60);
    expect(window.size).toBe(5);
    expect(window.has(30)).toBe(true);
    expect(window.has(32)).toBe(true);
    expect(window.has(27)).toBe(false);
  });

  it('maps normalized overlay boxes to percent CSS', () => {
    const styles = layoutOverlayPercentStyles({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.05,
    });
    expect(styles.left).toBe('10%');
    expect(styles.top).toBe('20%');
    expect(styles.width).toBe('30%');
    expect(styles.height).toBe('5%');
  });
});
