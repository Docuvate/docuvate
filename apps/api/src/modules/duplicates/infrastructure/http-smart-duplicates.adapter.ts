// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

const hitSchema = z.object({
  documentId: z.string(),
  similarity: z.number(),
});

const responseSchema = z.object({
  candidates: z.array(hitSchema),
});

export interface SmartDuplicatePeerInput {
  documentId: string;
  lines: string[];
}

export interface SmartDuplicateHit {
  documentId: string;
  similarity: number;
}

@Injectable()
export class HttpSmartDuplicatesAdapter {
  private workerUrl(): string {
    return process.env['WORKER_URL'] ?? 'http://localhost:8000';
  }

  private secret(): string {
    return process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
  }

  async detectCandidates(
    focusDocumentId: string,
    focusLines: string[],
    peers: SmartDuplicatePeerInput[]
  ): Promise<SmartDuplicateHit[]> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/ml/smart-duplicates/detect'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': this.secret(),
      },
      body: JSON.stringify({
        focusDocumentId,
        focusLines,
        peers,
      }),
    });
    if (!response.ok) {
      throw new Error(`Worker smart-duplicates detect failed: ${String(response.status)}`);
    }
    const data: unknown = await response.json();
    const parsed = responseSchema.parse(data);
    return parsed.candidates;
  }
}
