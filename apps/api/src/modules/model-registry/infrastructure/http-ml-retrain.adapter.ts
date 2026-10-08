import { Injectable } from '@nestjs/common';

export interface WorkerRetrainResult {
  versionTag: string;
  metrics: Record<string, number>;
  rowCount: number;
  datasetVersion: string;
  artifactUri: string | null;
  externalRunId: string | null;
  notes: string;
}

@Injectable()
export class HttpMlRetrainAdapter {
  private baseUrl(): string {
    return process.env['WORKER_URL']?.replace(/\/$/, '') ?? 'http://localhost:8000';
  }

  private secret(): string {
    return process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
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
      throw new Error(`Worker retrain failed (${response.status}): ${text.slice(0, 500)}`);
    }
    const body = (await response.json()) as {
      version_tag: string;
      metrics: Record<string, number>;
      row_count: number;
      dataset_version: string;
      artifact_uri?: string | null;
      external_run_id?: string | null;
      notes: string;
    };
    return {
      versionTag: body.version_tag,
      metrics: body.metrics ?? {},
      rowCount: body.row_count ?? 0,
      datasetVersion: body.dataset_version,
      artifactUri: body.artifact_uri ?? null,
      externalRunId: body.external_run_id ?? null,
      notes: body.notes ?? '',
    };
  }
}
