// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Worker 422 responses are permanent document/config failures; do not BullMQ-retry. */
export function isPermanentExtractionFailureMessage(message: string): boolean {
  return message.includes('Worker extraction failed: 422');
}
