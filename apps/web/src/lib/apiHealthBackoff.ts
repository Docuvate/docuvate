// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

const MIN_DELAY_SECONDS = 1;
const MAX_DELAY_SECONDS = 30;

/** Exponential backoff delay in seconds for the given attempt (1-based). */
export function apiHealthBackoffSeconds(attempt: number): number {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  const exponent = Math.min(safeAttempt - 1, 5);
  const delay = MIN_DELAY_SECONDS * 2 ** exponent;
  return Math.min(delay, MAX_DELAY_SECONDS);
}
