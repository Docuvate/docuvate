import { Injectable } from '@nestjs/common';
import type { ExtractedField } from '@docuvate/contracts';
import type {
  LabelFieldDefinitionInput,
  LabelFieldExtractionPort,
} from '../../../shared/domain/ports.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

@Injectable()
export class HttpLabelFieldExtractionAdapter implements LabelFieldExtractionPort {
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

  async extractLabelFields(
    text: string,
    tagName: string,
    fields: LabelFieldDefinitionInput[]
  ): Promise<ExtractedField[]> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/extract/label-fields'), {
      method: 'POST',
      headers: this.workerHeaders(),
      body: JSON.stringify({
        text,
        tag_name: tagName,
        fields: fields.map((f) => ({
          key: f.key,
          label: f.label,
          field_type: f.fieldType,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker label-field extraction failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      fields?: Array<{ key: string; value: string; confidence?: number }>;
    };
    return (data.fields ?? []).map((row) => ({
      key: row.key,
      value: row.value,
      confidence: row.confidence,
    }));
  }
}
