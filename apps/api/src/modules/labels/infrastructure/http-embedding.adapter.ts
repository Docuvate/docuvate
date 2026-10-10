// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { EmbeddingPort } from '../../../shared/domain/ports.js';
import { isRecord, parseNumber, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

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
  async embedTexts(texts: string[]): Promise<{ model: string; embeddings: number[][] }> {
    const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';

    const response = await fetch(workerApiUrl(workerUrl, '/embed'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`Worker embed failed: ${String(response.status)}`);
    }

    const raw: unknown = await response.json();
    if (!isRecord(raw)) {
      return { model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', embeddings: [] };
    }
    const model = parseString(raw.model);
    return {
      model:
        model.length > 0
          ? model
          : 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      embeddings: parseEmbeddings(raw.embeddings),
    };
  }
}
