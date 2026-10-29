// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export const MAX_API_EXTRACTION_SLOTS = 4;

export function clampExtractionSlots(slots: number): number {
  if (!Number.isFinite(slots) || slots < 1) {
    return 1;
  }
  return Math.min(MAX_API_EXTRACTION_SLOTS, Math.floor(slots));
}
