// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { EmbeddingPort } from '../../../shared/domain/ports.js';
import { isRecord, parseNumber, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

const WORKER_EMBED_BATCH_MAX = 32;

function parseEmbeddings(value: unknown): number[][] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: number[][] = [];
  for (const row of value) {
    if (!Array.isArray(row)) {
      continue;
    }
    const vector: number[] = [];
    for (const item of row) {
      vector.push(parseNumber(item, 0));
    }
    out.push(vector);
  }
  return out;
}

@Injectable()
export class HttpEmbeddingAdapter implements EmbeddingPort {
  private async embedBatch(
    texts: string[],
    inputType: 'query' | 'passage',
    signal?: AbortSignal
  ): Promise<{ model: string; embeddings: number[][] }> {
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';

    const response = await fetch(workerApiUrl(workerUrl, '/embed'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({ texts, input_type: inputType }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Worker embed failed: ${String(response.status)}`);
    }

    const raw: unknown = await response.json();
    if (!isRecord(raw)) {
      return { model: 'intfloat/multilingual-e5-small', embeddings: [] };
    }
    const model = parseString(raw.model);
    return {
      model:
        model.length > 0
          ? model
          : 'intfloat/multilingual-e5-small',
      embeddings: parseEmbeddings(raw.embeddings),
    };
  }

  async embedTexts(
    texts: string[],
    options?: { inputType?: 'query' | 'passage'; signal?: AbortSignal }
  ): Promise<{ model: string; embeddings: number[][] }> {
    const inputType = options?.inputType ?? 'passage';
    if (texts.length === 0) {
      return { model: 'intfloat/multilingual-e5-small', embeddings: [] };
    }

    const embeddings: number[][] = [];
    let model = 'intfloat/multilingual-e5-small';
    for (let offset = 0; offset < texts.length; offset += WORKER_EMBED_BATCH_MAX) {
      const batch = texts.slice(offset, offset + WORKER_EMBED_BATCH_MAX);
      const result = await this.embedBatch(batch, inputType, options?.signal);
      model = result.model;
      embeddings.push(...result.embeddings);
    }
    return { model, embeddings };
  }
}
