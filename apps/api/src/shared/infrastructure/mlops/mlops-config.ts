// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return defaultValue;
  }
  return raw.toLowerCase() === 'true' || raw === '1';
}

function envNumber(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') {
    return defaultValue;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export function mlopsEnabled(): boolean {
  return envFlag('MLOPS_ENABLED', false);
}

export function mlopsRetrainCorrectionThreshold(): number {
  return envNumber('MLOPS_RETRAIN_CORRECTION_THRESHOLD', 100);
}

export function mlopsRetrainCronIntervalMs(): number {
  return envNumber('MLOPS_RETRAIN_CRON_INTERVAL_MS', 6 * 60 * 60 * 1000);
}

export function mlopsCanaryMaxMetricDrop(): number {
  return envNumber('MLOPS_CANARY_MAX_METRIC_DROP', 0.05);
}

export function mlopsCanaryRequiredMetric(): string {
  return process.env.MLOPS_CANARY_REQUIRED_METRIC?.trim() ?? 'field_f1';
}

/** Families that consume extraction_field_corrections as primary training signal. */
export const CORRECTION_DRIVEN_FAMILY_IDS = ['heuristic-fields'] as const;
