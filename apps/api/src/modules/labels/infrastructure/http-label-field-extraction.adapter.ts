// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import type {
  LabelFieldDefinitionInput,
  LabelFieldExtractionPort,
} from '../../../shared/domain/ports.js';
import {
  isRecord,
  parseOptionalNumber,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';

function parseExtractedFields(raw: unknown): ExtractedField[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ExtractedField[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const key = parseString(item.key);
    const value = parseString(item.value);
    if (!key) {
      continue;
    }
    const confidence = parseOptionalNumber(item.confidence);
    out.push(confidence === null ? { key, value } : { key, value, confidence });
  }
  return out;
}

@Injectable()
export class HttpLabelFieldExtractionAdapter implements LabelFieldExtractionPort {
  private workerHeaders(): Record<string, string> {
    const secret = process.env.WORKER_SECRET ?? 'worker-shared-secret';
    return {
      'Content-Type': 'application/json',
      'X-Worker-Secret': secret,
    };
  }

  private workerUrl(): string {
    return process.env.WORKER_URL ?? 'http://localhost:8000';
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
      throw new Error(`Worker label-field extraction failed: ${String(response.status)}`);
    }

    const raw: unknown = await response.json();
    if (!isRecord(raw)) {
      return [];
    }
    return parseExtractedFields(raw.fields);
  }
}
