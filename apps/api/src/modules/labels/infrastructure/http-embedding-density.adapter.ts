// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import { z } from 'zod';
import {
  type EmbeddingDensityWorkerState,
  embeddingDensityWorkerStateSchema,
  parseEmbeddingDensityClassifyWire,
  parseEmbeddingDensityWorkerState,
} from '../domain/embedding-density-worker-state.schema.js';

const workerStateEnvelopeSchema = z.object({
  state: embeddingDensityWorkerStateSchema,
});

export interface EmbeddingDensityClassifyResult {
  decisionTier: string;
  confidence: number;
  labelId: string | null;
  groupId: string | null;
  reason: string;
  logPx: number;
  posterior: Record<string, number>;
  confirmLabelId: string | null;
  confirmConfidence: number;
}

@Injectable()
export class HttpEmbeddingDensityAdapter {
  private workerUrl(): string {
    return process.env['WORKER_URL'] ?? 'http://localhost:8000';
  }

  private secret(): string {
    return process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
  }

  async classify(
    state: EmbeddingDensityWorkerState,
    vector: number[]
  ): Promise<EmbeddingDensityClassifyResult> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/ml/embedding-density/classify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({ state, vector }),
    });
    if (!response.ok) {
      throw new Error(`Worker embedding-density classify failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    const parsed = parseEmbeddingDensityClassifyWire(data);
    return {
      decisionTier: parsed.decision_tier,
      confidence: parsed.confidence,
      labelId: parsed.label_id,
      groupId: parsed.group_id,
      reason: parsed.reason,
      logPx: parsed.log_px,
      posterior: parsed.posterior,
      confirmLabelId: parsed.confirm_label_id ?? null,
      confirmConfidence: parsed.confirm_confidence ?? 0,
    };
  }

  async calibrate(payload: {
    state: EmbeddingDensityWorkerState;
    vectors: number[][];
    exampleLabelIds: string[];
    documentIds: string[];
    delta: number;
  }): Promise<{ state: EmbeddingDensityWorkerState; metrics: Record<string, number> }> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/ml/embedding-density/calibrate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({
        state: payload.state,
        vectors: payload.vectors,
        label_ids: payload.exampleLabelIds,
        document_ids: payload.documentIds,
        delta: payload.delta,
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker embedding-density calibrate failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    const envelope = z
      .object({
        state: embeddingDensityWorkerStateSchema,
        metrics: z.record(z.string(), z.number()),
      })
      .parse(data);
    return { state: envelope.state, metrics: envelope.metrics };
  }

  async train(payload: {
    labelIds: string[];
    vectors: number[][];
    exampleLabelIds: string[];
    unlabeledVectors?: number[][];
  }): Promise<EmbeddingDensityWorkerState> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/ml/embedding-density/train'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({
        label_ids: payload.labelIds,
        vectors: payload.vectors,
        example_label_ids: payload.exampleLabelIds,
        unlabeled_vectors: payload.unlabeledVectors ?? [],
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker embedding-density train failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    const parsed = workerStateEnvelopeSchema.parse(data);
    return parsed.state;
  }

  async correct(
    state: EmbeddingDensityWorkerState,
    vector: number[],
    targetLabelId: string
  ): Promise<EmbeddingDensityWorkerState> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/ml/embedding-density/correct'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({ state, vector, target_label_id: targetLabelId }),
    });
    if (!response.ok) {
      throw new Error(`Worker embedding-density correct failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    return workerStateEnvelopeSchema.parse(data).state;
  }
}
