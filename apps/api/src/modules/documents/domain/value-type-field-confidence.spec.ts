// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { autoPromoteMinConfidenceForField } from './value-type-field-confidence.js';

const API_ARTIFACT = join(
  __dirname,
  'artifacts/value-types-field-confidence.v1.json'
);
const WORKER_ARTIFACT = join(
  __dirname,
  '../../../../../worker/src/docuvate_worker/infrastructure/ml/artifacts/value-types-field-confidence.v1.json'
);

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

describe('value-type field confidence artifact', () => {
  it('ships beside compiled domain code (API image runtime path)', () => {
    expect(existsSync(API_ARTIFACT)).toBe(true);
  });

  it('matches worker calibration artifact when worker tree is present', () => {
    if (!existsSync(WORKER_ARTIFACT)) {
      return;
    }
    expect(sha256File(API_ARTIFACT)).toBe(sha256File(WORKER_ARTIFACT));
  });

  it('loads calibrated thresholds for heuristic fields', () => {
    expect(autoPromoteMinConfidenceForField('date')).toBe(0.95);
    expect(autoPromoteMinConfidenceForField('amount')).toBe(0.55);
    expect(autoPromoteMinConfidenceForField('vendor')).toBe(0.5);
    expect(autoPromoteMinConfidenceForField('unknown')).toBe(0.9);
  });
});
