// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';

import { measureBottomSheetToastOffset } from './measureBottomSheetToastOffset';

function sheet(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'bottom-sheet-panel';
  el.setAttribute('role', 'dialog');
  el.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: top, width: 360, height });
  return el;
}

describe('measureBottomSheetToastOffset', () => {
  it('returns 0 when no sheet is open', () => {
    const root = document.createElement('div');
    expect(measureBottomSheetToastOffset(root, 800)).toBe(0);
  });

  it('returns the distance from the viewport bottom to the tallest sheet top', () => {
    const root = document.createElement('div');
    root.append(sheet(520, 280));
    expect(measureBottomSheetToastOffset(root, 800)).toBe(280);
  });

  it('uses the taller of two open sheets', () => {
    const root = document.createElement('div');
    root.append(sheet(600, 200), sheet(400, 400));
    expect(measureBottomSheetToastOffset(root, 800)).toBe(400);
  });
});
