// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { WorkerExtractCapacityCoordinator } from './worker-extract-capacity.coordinator.js';

export async function withWorkerExtractSlot<T>(
  coordinator: WorkerExtractCapacityCoordinator,
  run: () => Promise<T>
): Promise<T> {
  await coordinator.acquireSlot();
  try {
    return await run();
  } finally {
    coordinator.releaseSlot();
  }
}
