// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import type { WorkerExtractSlotPort } from '../domain/worker-extract-slot.port.js';
import { ExtractionSlotLimiter } from './extraction-slot-limiter.js';
import {
  fetchWorkerExtractCapacity,
  type WorkerExtractCapacity,
} from './worker-extract-capacity.client.js';

const REFRESH_INTERVAL_MS = 30_000;

@Injectable()
export class WorkerExtractCapacityCoordinator
  implements OnModuleInit, OnModuleDestroy, WorkerExtractSlotPort
{
  private readonly logger = new Logger(WorkerExtractCapacityCoordinator.name);
  private readonly limiter = new ExtractionSlotLimiter(1);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private lastCapacity: WorkerExtractCapacity | null = null;
  private workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
  private readonly slotListeners: ((slots: number) => void)[] = [];
  private readonly heldSlot = new AsyncLocalStorage<true>();

  onModuleInit(): void {
    this.start(this.workerUrl);
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(workerUrl: string): void {
    this.stop();
    this.workerUrl = workerUrl;
    void this.refresh(workerUrl);
    this.refreshTimer = setInterval(() => {
      void this.refresh(workerUrl);
    }, REFRESH_INTERVAL_MS);
  }

  stop(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async refresh(workerUrl: string): Promise<void> {
    const capacity = await fetchWorkerExtractCapacity(workerUrl);
    this.lastCapacity = capacity;
    const slots = capacity?.recommendedConcurrentExtractions ?? 1;
    this.limiter.setMaxSlots(slots);
    this.notifySlots();
    this.logger.debug(
      `Worker extract capacity slots=${String(slots)} free=${String(capacity?.extractSlotsFree ?? 'unknown')}`
    );
  }

  lastReport(): WorkerExtractCapacity | null {
    return this.lastCapacity;
  }

  /** Called with the current slot count now and whenever it changes. */
  onSlotsChanged(listener: (slots: number) => void): void {
    this.slotListeners.push(listener);
    listener(this.limiter.currentMaxSlots());
  }

  private notifySlots(): void {
    const slots = this.limiter.currentMaxSlots();
    for (const listener of this.slotListeners) {
      listener(slots);
    }
  }

  recommendedSlots(): number {
    return this.limiter.currentMaxSlots();
  }

  async runWithSlot<T>(run: () => Promise<T>): Promise<T> {
    if (this.heldSlot.getStore() === true) {
      return run();
    }
    await this.limiter.acquire();
    try {
      return await this.heldSlot.run(true, run);
    } finally {
      this.limiter.release();
    }
  }

  onWorkerPressure503(retryAfterSeconds: number): void {
    this.limiter.reduceOnPressure();
    this.notifySlots();
    this.logger.warn(
      `Worker returned 503; reduced API extraction slots to ${String(this.limiter.currentMaxSlots())} (retry after ${String(retryAfterSeconds)}s)`
    );
    setTimeout(() => {
      void this.refresh(this.workerUrl);
    }, retryAfterSeconds * 1000);
  }
}

export function parseWorkerRetryAfterSeconds(header: string | null): number {
  if (!header) {
    return 5;
  }
  const trimmed = header.trim();
  const asInt = Number.parseInt(trimmed, 10);
  if (Number.isFinite(asInt) && asInt > 0) {
    return asInt;
  }
  const asDate = Date.parse(trimmed);
  if (Number.isFinite(asDate)) {
    return Math.max(1, Math.ceil((asDate - Date.now()) / 1000));
  }
  return 5;
}
