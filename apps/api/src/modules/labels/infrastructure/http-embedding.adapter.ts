// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import type { EmbeddingPort } from '../../../shared/domain/ports.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

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
      throw new Error(`Worker embed failed: ${response.status}`);
    }

    const data = (await response.json()) as { model: string; embeddings: number[][] };
    return {
      model: data.model ?? 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      embeddings: data.embeddings ?? [],
    };
  }
}
