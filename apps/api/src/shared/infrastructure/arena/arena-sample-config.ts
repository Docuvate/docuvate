// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const DEFAULT_ARENA_SAMPLE_RATE = 200;

/** Every N successful extractions system-wide triggers a background arena compare; 0 disables. */
export function arenaSampleRate(): number {
  const raw = process.env['ARENA_SAMPLE_RATE'];
  if (raw == null || raw.trim() === '') {
    return DEFAULT_ARENA_SAMPLE_RATE;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_ARENA_SAMPLE_RATE;
  }
  return parsed;
}
