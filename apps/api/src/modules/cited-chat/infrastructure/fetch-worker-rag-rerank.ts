// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  isRecord,
  parseNumber,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';

export interface RagRetrievePassage {
  id: string;
  text: string;
}

export interface RagRetrieveResultItem {
  id: string;
  score: number;
}

export interface RagRetrieveResponse {
  reachable: boolean;
  rerankerUsed: boolean;
  rerankerModel: string | null;
  results: RagRetrieveResultItem[];
}

function parseRagRetrieveResultItem(value: unknown): RagRetrieveResultItem | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id).trim();
  if (!id) {
    return null;
  }
  const score = parseNumber(value.score, Number.NaN);
  if (!Number.isFinite(score)) {
    return null;
  }
  return { id, score };
}

function parseRagRetrieveResponse(value: unknown): RagRetrieveResponse | null {
  if (!isRecord(value)) {
    return null;
  }
  const resultsRaw = value.results;
  const results: RagRetrieveResultItem[] = [];
  if (Array.isArray(resultsRaw)) {
    for (const item of resultsRaw) {
      const parsed = parseRagRetrieveResultItem(item);
      if (parsed) {
        results.push(parsed);
      }
    }
  }
  return {
    reachable: true,
    rerankerUsed: Boolean(value.reranker_used),
    rerankerModel: parseOptionalString(value.reranker_model),
    results,
  };
}

export async function fetchWorkerRagRerank(
  query: string,
  passages: RagRetrievePassage[]
): Promise<RagRetrieveResponse> {
  const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
  const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
  if (!passages.length) {
    return { reachable: true, rerankerUsed: true, rerankerModel: null, results: [] };
  }
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/v1/rag/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({ query, passages }),
      signal: AbortSignal.timeout(Number(process.env['WORKER_RAG_TIMEOUT_MS'] ?? 30_000)),
    });
    if (!response.ok) {
      return { reachable: false, rerankerUsed: false, rerankerModel: null, results: [] };
    }
    const data: unknown = await response.json();
    const parsed = parseRagRetrieveResponse(data);
    if (!parsed) {
      return { reachable: false, rerankerUsed: false, rerankerModel: null, results: [] };
    }
    return parsed;
  } catch {
    return { reachable: false, rerankerUsed: false, rerankerModel: null, results: [] };
  }
}
