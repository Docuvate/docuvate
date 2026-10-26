// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { WorkerExtractSlotPort } from '../domain/worker-extract-slot.port.js';

export async function withWorkerExtractSlot<T>(
  coordinator: WorkerExtractSlotPort,
  run: () => Promise<T>
): Promise<T> {
  await coordinator.acquireSlot();
  try {
    return await run();
  } finally {
    coordinator.releaseSlot();
  }
}
