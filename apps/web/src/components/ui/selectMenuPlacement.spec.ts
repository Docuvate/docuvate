// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  computeSelectMenuPlacement,
  estimateSelectMenuContentHeight,
  SELECT_MENU_ITEM_ESTIMATE_PX,
} from './selectMenuPlacement';

describe('computeSelectMenuPlacement', () => {
  it('opens downward when there is room below', () => {
    const triggerRect = {
      top: 100,
      bottom: 130,
      left: 40,
      width: 200,
    } as DOMRect;

    const placement = computeSelectMenuPlacement({
      triggerRect,
      measuredMenuHeight: 120,
      optionCount: 3,
      viewportHeight: 800,
    });

    expect(placement.openUp).toBe(false);
    expect(placement.scrollable).toBe(false);
    expect(placement.maxHeight).toBeUndefined();
    expect(placement.top).toBe(132);
  });

  it('flips upward when below space is tight', () => {
    const triggerRect = {
      top: 720,
      bottom: 750,
      left: 12,
      width: 180,
    } as DOMRect;

    const placement = computeSelectMenuPlacement({
      triggerRect,
      measuredMenuHeight: 160,
      optionCount: 6,
      viewportHeight: 800,
    });

    expect(placement.openUp).toBe(true);
    expect(placement.top).toBeLessThan(triggerRect.top);
  });

  it('does not scroll for six options when viewport has space below', () => {
    const triggerRect = {
      top: 400,
      bottom: 432,
      left: 20,
      width: 220,
    } as DOMRect;
    const optionCount = 6;
    const measured = estimateSelectMenuContentHeight(optionCount);

    const placement = computeSelectMenuPlacement({
      triggerRect,
      measuredMenuHeight: measured,
      optionCount,
      viewportHeight: 900,
    });

    expect(placement.scrollable).toBe(false);
    expect(placement.maxHeight).toBeUndefined();
    expect(measured).toBeGreaterThan(optionCount * SELECT_MENU_ITEM_ESTIMATE_PX);
  });
});
