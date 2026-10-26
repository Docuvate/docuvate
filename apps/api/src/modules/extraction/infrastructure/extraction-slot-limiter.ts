// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const MAX_API_EXTRACTION_SLOTS = 4;

export class ExtractionSlotLimiter {
  private maxSlots: number;
  private inFlight = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(initialSlots: number) {
    this.maxSlots = clampSlots(initialSlots);
  }

  currentMaxSlots(): number {
    return this.maxSlots;
  }

  setMaxSlots(slots: number): void {
    this.maxSlots = clampSlots(slots);
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

function clampSlots(slots: number): number {
  if (!Number.isFinite(slots) || slots < 1) {
    return 1;
  }
  return Math.min(MAX_API_EXTRACTION_SLOTS, Math.floor(slots));
}

/** Upper bound for BullMQ handlers when env is unset (effective parallelism is slot-limited). */
export function extractionWorkerMaxConcurrency(): number {
  const raw = process.env['DOCUMENT_EXTRACTION_CONCURRENCY'];
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(MAX_API_EXTRACTION_SLOTS, parsed);
    }
  }
  return MAX_API_EXTRACTION_SLOTS;
}
