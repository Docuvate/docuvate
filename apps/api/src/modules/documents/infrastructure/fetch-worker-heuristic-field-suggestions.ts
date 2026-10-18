// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';

import { isRecord, parseOptionalNumber, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';

function parseFields(value: unknown): ExtractedField[] {
  if (!isRecord(value) || !Array.isArray(value.fields)) {
    return [];
  }
  const out: ExtractedField[] = [];
  for (const item of value.fields) {
    if (!isRecord(item)) {
      continue;
    }
    const key = parseString(item.key).trim();
    const fieldValue = parseString(item.value).trim();
    if (!key || !fieldValue) {
      continue;
    }
    const confidence = parseOptionalNumber(item.confidence);
    out.push({
      key,
      value: fieldValue,
      ...(confidence != null ? { confidence } : {}),
    });
  }
  return out;
}

export async function fetchWorkerHeuristicFieldSuggestions(text: string): Promise<ExtractedField[]> {
  const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
  const response = await fetch(
    workerApiUrl(workerUrl, '/extract/heuristic-field-suggestions'),
    {
      method: 'POST',
      headers: {
        ...workerRequestHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(Number(process.env['WORKER_HEURISTIC_TIMEOUT_MS'] ?? 30_000)),
    }
  );
  if (!response.ok) {
    throw new Error(`Worker heuristic field suggestions failed: ${String(response.status)}`);
  }
  const data: unknown = await response.json();
  return parseFields(data);
}
