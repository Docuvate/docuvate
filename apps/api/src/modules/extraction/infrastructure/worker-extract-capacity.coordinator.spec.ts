// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  parseWorkerRetryAfterSeconds,
  WorkerExtractCapacityCoordinator,
} from './worker-extract-capacity.coordinator.js';

describe('parseWorkerRetryAfterSeconds', () => {
  it('defaults when header is missing', () => {
    expect(parseWorkerRetryAfterSeconds(null)).toBe(5);
  });

  it('parses integer seconds', () => {
    expect(parseWorkerRetryAfterSeconds('12')).toBe(12);
  });
});

describe('WorkerExtractCapacityCoordinator slot listeners', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts listeners at one slot and follows the worker report', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              recommendedConcurrentExtractions: 3,
              activeExtractJobs: 0,
              extractSlotsFree: 3,
              memoryAvailableBytes: null,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        )
      )
    );
    const coordinator = new WorkerExtractCapacityCoordinator();
    const seen: number[] = [];
    coordinator.onSlotsChanged((slots) => {
      seen.push(slots);
    });
    await coordinator.refresh('http://worker.test');
    expect(seen).toEqual([1, 3]);
  });
});

describe('WorkerExtractCapacityCoordinator.runWithSlot', () => {
  it('lets a nested worker call inside a job reuse the held slot', async () => {
    const coordinator = new WorkerExtractCapacityCoordinator();
    expect(coordinator.recommendedSlots()).toBe(1);
    const result = await coordinator.runWithSlot(() =>
      coordinator.runWithSlot(() => Promise.resolve('nested-done'))
    );
    expect(result).toBe('nested-done');
  });

  it('still serialises independent callers on one slot', async () => {
    const coordinator = new WorkerExtractCapacityCoordinator();
    const order: string[] = [];
    let releaseFirst: () => void = () => undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = coordinator.runWithSlot(async () => {
      order.push('first-start');
      await firstGate;
      order.push('first-end');
    });
    const second = coordinator.runWithSlot(() => {
      order.push('second-start');
      return Promise.resolve();
    });
    await Promise.resolve();
    expect(order).toEqual(['first-start']);
    releaseFirst();
    await Promise.all([first, second]);
    expect(order).toEqual(['first-start', 'first-end', 'second-start']);
  });
});
