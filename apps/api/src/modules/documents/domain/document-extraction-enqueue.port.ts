// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Minimal BullMQ enqueue surface used by orphan extraction reconcile. */
export interface DocumentExtractionEnqueuePort {
  isJobQueuedOrActive(documentId: string): Promise<boolean>;
  enqueue(documentId: string, userId: string): Promise<void>;
}
