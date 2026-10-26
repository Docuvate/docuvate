// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { ExtractionSlotLimiter } from './extraction-slot-limiter.js';

describe('ExtractionSlotLimiter', () => {
  it('defaults unknown slot counts to 1', () => {
    const limiter = new ExtractionSlotLimiter(Number.NaN);
    expect(limiter.currentMaxSlots()).toBe(1);
  });

  it('halves slots on pressure but not below 1', () => {
    const limiter = new ExtractionSlotLimiter(4);
    limiter.reduceOnPressure();
    expect(limiter.currentMaxSlots()).toBe(2);
    limiter.reduceOnPressure();
    expect(limiter.currentMaxSlots()).toBe(1);
    limiter.reduceOnPressure();
    expect(limiter.currentMaxSlots()).toBe(1);
  });

  it('blocks acquire until a slot is released', async () => {
    const limiter = new ExtractionSlotLimiter(1);
    await limiter.acquire();
    let released = false;
    const pending = limiter.acquire().then(() => {
      released = true;
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(released).toBe(false);
    limiter.release();
    await pending;
    expect(released).toBe(true);
  });
});
