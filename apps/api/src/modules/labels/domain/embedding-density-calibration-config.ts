// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export const EMBEDDING_DENSITY_CALIBRATION_DEBOUNCE_MS = 120_000;

export const EMBEDDING_DENSITY_RECALIBRATION_SCAN_MS = 600_000;

/** New labeled blocks since last calibration run before scheduling a refresh. */
export const EMBEDDING_DENSITY_RECALIBRATION_MIN_NEW_EXAMPLES = 80;
