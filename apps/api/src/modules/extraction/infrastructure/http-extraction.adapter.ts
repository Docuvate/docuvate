import { Injectable } from '@nestjs/common';
import type { ExtractionResult } from '@docuvate/contracts';
import type {
  ExtractionCompareItem,
  ExtractionExtractOptions,
  ExtractionPort,
} from '../../../shared/domain/ports.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  workerCompareTimeoutMs,
} from '../../../shared/infrastructure/worker/worker-fetch.js';

@Injectable()
export class HttpExtractionAdapter implements ExtractionPort {
  private workerHeaders(): Record<string, string> {
    const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
    return {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret,
    };
  }

  private workerUrl(): string {
    return process.env['WORKER_URL'] ?? 'http://localhost:8000';
  }

  async extract(
    buffer: Buffer,
    mimeType: string,
    options?: ExtractionExtractOptions
  ): Promise<ExtractionResult> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/extract'), {
      method: 'POST',
      headers: this.workerHeaders(),
      body: JSON.stringify({
        mime_type: mimeType,
        content_base64: buffer.toString('base64'),
        engine: options?.engine,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker extraction failed: ${response.status}`);
    }

    const data = (await response.json()) as ExtractionResult;
    const markdown = data.markdown?.trim();
    return {
      text: data.text ?? '',
      fields: data.fields ?? [],
      blocks: data.blocks ?? [],
      ...(markdown ? { markdown } : {}),
    };
  }

  async listEngines(): Promise<
    Array<{
      id: string;
      label: string;
      description: string;
      available?: boolean;
      arenaEligible?: boolean;
    }>
  > {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/extract/engines'), {
      headers: this.workerHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Worker engines list failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      engines: Array<{
        id: string;
        label: string;
        description: string;
        available?: boolean;
        arenaEligible?: boolean;
      }>;
    };
    return data.engines ?? [];
  }

  async compare(
    buffer: Buffer,
    mimeType: string,
    engines: string[],
    maxPages?: number | null
  ): Promise<{ items: ExtractionCompareItem[]; engines: string[] }> {
    const data = await fetchWorkerJson<{
      items: ExtractionCompareItem[];
      engines?: string[];
    }>(
      workerApiUrl(this.workerUrl(), '/extract/compare'),
      {
        method: 'POST',
        headers: this.workerHeaders(),
        body: JSON.stringify({
          mime_type: mimeType,
          content_base64: buffer.toString('base64'),
          engines,
          max_pages: maxPages ?? 3,
        }),
      },
      workerCompareTimeoutMs()
    );
    return {
      items: data.items ?? [],
      engines: data.engines ?? engines,
    };
  }
}
