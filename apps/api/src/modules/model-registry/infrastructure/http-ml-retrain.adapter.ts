// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import {
  isRecord,
  parseNumber,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';

export interface WorkerRetrainResult {
  versionTag: string;
  metrics: Record<string, number>;
  rowCount: number;
  datasetVersion: string;
  artifactUri: string | null;
  externalRunId: string | null;
  notes: string;
}

function parseMetrics(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = parseNumber(value, 0);
  }
  return out;
}

@Injectable()
export class HttpMlRetrainAdapter {
  private baseUrl(): string {
    return process.env.WORKER_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';
  }

  private secret(): string {
    return process.env.WORKER_SECRET ?? 'worker-shared-secret';
  }

  async runRetrainStub(input: {
    jobId: string;
    familyId: string;
    correctionCount: number;
  }): Promise<WorkerRetrainResult> {
    const response = await fetch(`${this.baseUrl()}/v1/ml/retrain/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({
        job_id: input.jobId,
        family_id: input.familyId,
        correction_count: input.correctionCount,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Worker retrain failed (${String(response.status)}): ${text.slice(0, 500)}`
      );
    }
    const raw: unknown = await response.json();
    if (!isRecord(raw)) {
      throw new Error('Worker retrain returned invalid JSON');
    }
    return {
      versionTag: parseString(raw.version_tag),
      metrics: parseMetrics(raw.metrics),
      rowCount: parseNumber(raw.row_count, 0),
      datasetVersion: parseString(raw.dataset_version),
      artifactUri: parseOptionalString(raw.artifact_uri),
      externalRunId: parseOptionalString(raw.external_run_id),
      notes: parseString(raw.notes),
    };
  }
}
