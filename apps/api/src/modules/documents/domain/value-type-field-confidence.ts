// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ValueTypeFieldConfidenceArtifact {
  auto_promote_min_by_field: Record<string, number>;
}

let cached: ValueTypeFieldConfidenceArtifact | null = null;

function loadArtifact(): ValueTypeFieldConfidenceArtifact {
  if (cached) {
    return cached;
  }
  const path = join(
    __dirname,
    '../../../../../worker/src/docuvate_worker/infrastructure/ml/artifacts/value-types-field-confidence.v1.json'
  );
  cached = JSON.parse(readFileSync(path, 'utf8')) as ValueTypeFieldConfidenceArtifact;
  return cached;
}

export function autoPromoteMinConfidenceForField(semanticKey: string): number {
  const artifact = loadArtifact();
  return artifact.auto_promote_min_by_field[semanticKey] ?? 0.9;
}
