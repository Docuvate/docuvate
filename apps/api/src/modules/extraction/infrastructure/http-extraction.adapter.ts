// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ExtractedField,
  ExtractionResult,
  LayoutIrBlock,
  LayoutIrDocument,
  LayoutIrPage,
} from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import type {
  ExtractionCompareItem,
  ExtractionExtractOptions,
  ExtractionPort,
} from '../../../shared/domain/ports.js';
import { isRecord, parseOptionalString, parseString } from '../../../shared/infrastructure/database/row-parse.js';
import { workerApiUrl } from '../../../shared/infrastructure/worker/worker-api-path.js';
import {
  fetchWorkerJson,
  workerCompareTimeoutMs,
} from '../../../shared/infrastructure/worker/worker-fetch.js';
import { workerRequestHeaders } from '../../../shared/infrastructure/worker/worker-request-headers.js';

function isExtractedField(value: unknown): value is ExtractedField {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.key === 'string' && typeof value.value === 'string';
}

function parseExtractedFields(value: unknown): ExtractedField[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const fields: ExtractedField[] = [];
  for (const item of value) {
    if (isExtractedField(item)) {
      fields.push(item);
    }
  }
  return fields;
}

function parseFieldSuggestions(
  value: unknown
): { key: string; value: string; confidence?: number }[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out: { key: string; value: string; confidence?: number }[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const key = parseString(item.key).trim();
    const fieldValue = parseString(item.value);
    if (!key) {
      continue;
    }
    const suggestion: { key: string; value: string; confidence?: number } = {
      key,
      value: fieldValue,
    };
    if (typeof item.confidence === 'number' && Number.isFinite(item.confidence)) {
      suggestion.confidence = item.confidence;
    }
    out.push(suggestion);
  }
  return out.length > 0 ? out : undefined;
}

function isLayoutIrBlock(value: unknown): value is LayoutIrBlock {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.page === 'number' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    typeof value.text === 'string'
  );
}

function isLayoutIrPage(value: unknown): value is LayoutIrPage {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.page !== 'number' ||
    typeof value.widthPt !== 'number' ||
    typeof value.heightPt !== 'number' ||
    !Array.isArray(value.blocks)
  ) {
    return false;
  }
  for (const block of value.blocks) {
    if (!isLayoutIrBlock(block)) {
      return false;
    }
  }
  return true;
}

function parseWorkerLayoutIr(value: unknown): LayoutIrDocument | undefined {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.pages)) {
    return undefined;
  }
  const pages: LayoutIrPage[] = [];
  for (const page of value.pages) {
    if (!isLayoutIrPage(page)) {
      return undefined;
    }
    pages.push(page);
  }
  return { version: 1, pages };
}

function parseExtractionResultBody(value: unknown): ExtractionResult {
  const row = isRecord(value) ? value : {};
  const text = parseString(row.text);
  const markdown = parseOptionalString(row.markdown)?.trim();
  const layoutIr = parseWorkerLayoutIr(row.layoutIr);
  const fieldSuggestions = parseFieldSuggestions(row.fieldSuggestions);
  const result: ExtractionResult = {
    text,
    fields: parseExtractedFields(row.fields),
    fieldSuggestions,
  };
  if (markdown) {
    result.markdown = markdown;
  }
  if (layoutIr) {
    result.layoutIr = layoutIr;
  }
  return result;
}

interface WorkerEngineListItem {
  id: string;
  label: string;
  description: string;
  available?: boolean;
  arenaEligible?: boolean;
}

function parseEngineListItem(value: unknown): WorkerEngineListItem | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id).trim();
  const label = parseString(value.label);
  const description = parseString(value.description);
  if (!id) {
    return null;
  }
  const item: WorkerEngineListItem = { id, label, description };
  if (typeof value.available === 'boolean') {
    item.available = value.available;
  }
  if (typeof value.arenaEligible === 'boolean') {
    item.arenaEligible = value.arenaEligible;
  }
  return item;
}

function parseWorkerEnginesResponse(value: unknown): WorkerEngineListItem[] {
  if (!isRecord(value) || !Array.isArray(value.engines)) {
    return [];
  }
  const engines: WorkerEngineListItem[] = [];
  for (const entry of value.engines) {
    const parsed = parseEngineListItem(entry);
    if (parsed) {
      engines.push(parsed);
    }
  }
  return engines;
}

function parseCompareResponse(
  value: unknown,
  fallbackEngines: string[]
): { items: ExtractionCompareItem[]; engines: string[] } {
  if (!isRecord(value)) {
    return { items: [], engines: fallbackEngines };
  }
  const items = Array.isArray(value.items)
    ? value.items.filter((item): item is ExtractionCompareItem => isRecord(item))
    : [];
  const engines = Array.isArray(value.engines)
    ? value.engines.filter((e): e is string => typeof e === 'string')
    : fallbackEngines;
  return { items, engines };
}

@Injectable()
export class HttpExtractionAdapter implements ExtractionPort {
  private workerHeaders(): Record<string, string> {
    return workerRequestHeaders();
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
      throw new Error(`Worker extraction failed: ${String(response.status)}`);
    }

    const data: unknown = await response.json();
    return parseExtractionResultBody(data);
  }

  async listEngines(): Promise<WorkerEngineListItem[]> {
    const response = await fetch(workerApiUrl(this.workerUrl(), '/extract/engines'), {
      headers: this.workerHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Worker engines list failed: ${String(response.status)}`);
    }
    const data: unknown = await response.json();
    return parseWorkerEnginesResponse(data);
  }

  async compare(
    buffer: Buffer,
    mimeType: string,
    engines: string[],
    maxPages?: number | null
  ): Promise<{ items: ExtractionCompareItem[]; engines: string[] }> {
    const data: unknown = await fetchWorkerJson(
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
    return parseCompareResponse(data, engines);
  }
}
