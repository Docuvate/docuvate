// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isRecord } from '../../../shared/infrastructure/database/row-parse.js';

interface ValueTypeFieldConfidenceArtifact {
  auto_promote_min_by_field: Record<string, number>;
}

let cached: ValueTypeFieldConfidenceArtifact | null = null;

function parseArtifact(raw: unknown): ValueTypeFieldConfidenceArtifact {
  if (!isRecord(raw)) {
    throw new Error('value-types-field-confidence artifact must be an object');
  }
  const byField = raw.auto_promote_min_by_field;
  if (typeof byField !== 'object' || byField === null) {
    throw new Error('value-types-field-confidence artifact missing auto_promote_min_by_field');
  }
  const autoPromoteMinByField: Record<string, number> = {};
  for (const [key, value] of Object.entries(byField)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`invalid confidence for ${key}`);
    }
    autoPromoteMinByField[key] = value;
  }
  return { auto_promote_min_by_field: autoPromoteMinByField };
}

function loadArtifact(): ValueTypeFieldConfidenceArtifact {
  if (cached) {
    return cached;
  }
  const path = join(__dirname, 'artifacts/value-types-field-confidence.v1.json');
  cached = parseArtifact(JSON.parse(readFileSync(path, 'utf8')));
  return cached;
}

export function autoPromoteMinConfidenceForField(semanticKey: string): number {
  const artifact = loadArtifact();
  return artifact.auto_promote_min_by_field[semanticKey] ?? 0.9;
}
