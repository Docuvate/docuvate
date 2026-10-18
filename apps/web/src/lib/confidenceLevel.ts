// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Figma thresholds: high ≥ 90 %, medium 60–89 %, low &lt; 60 % (details only). */
export function confidenceLevelFromPercent(percent: number): ConfidenceLevel {
  if (percent >= 90) {
    return 'high';
  }
  if (percent >= 60) {
    return 'medium';
  }
  return 'low';
}

export function confidenceLevelFromRatio(ratio: number): ConfidenceLevel {
  return confidenceLevelFromPercent(Math.round(ratio * 100));
}
