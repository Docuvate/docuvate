// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface WorkerExtractSlotPort {
  acquireSlot(): Promise<void>;
  releaseSlot(): void;
  onWorkerPressure503(retryAfterSeconds: number): void;
}
