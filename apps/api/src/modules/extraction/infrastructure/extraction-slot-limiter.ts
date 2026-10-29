// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { clampExtractionSlots } from '../domain/extraction-slots.js';


export class ExtractionSlotLimiter {
  private maxSlots: number;
  private inFlight = 0;
  private readonly waiters: (() => void)[] = [];

  constructor(initialSlots: number) {
    this.maxSlots = clampExtractionSlots(initialSlots);
  }

  currentMaxSlots(): number {
    return this.maxSlots;
  }

  setMaxSlots(slots: number): void {
    this.maxSlots = clampExtractionSlots(slots);
    this.wakeWaiters();
  }

  reduceOnPressure(): void {
    this.setMaxSlots(Math.max(1, Math.floor(this.maxSlots / 2)));
  }

  async acquire(): Promise<void> {
    if (this.inFlight < this.maxSlots) {
      this.inFlight += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(() => {
        this.inFlight += 1;
        resolve();
      });
    });
  }

  release(): void {
    if (this.inFlight > 0) {
      this.inFlight -= 1;
    }
    this.wakeWaiters();
  }

  private wakeWaiters(): void {
    while (this.waiters.length > 0 && this.inFlight < this.maxSlots) {
      const next = this.waiters.shift();
      next?.();
    }
  }
}
