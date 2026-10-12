// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  isRecord,
  parseOptionalString,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';

export interface ExtractivePassageInput {
  id: string;
  text: string;
}

export interface WorkerExtractiveAnswerResult {
  reachable: boolean;
  passageId: string | null;
  answer: string | null;
  quote: string | null;
}

function parseExtractiveAnswerResponse(value: unknown): WorkerExtractiveAnswerResult | null {
  if (!isRecord(value)) {
    return null;
  }
  const passageId = parseOptionalString(value.passage_id)?.trim() ?? null;
  const answer = parseOptionalString(value.answer)?.trim() ?? null;
  const quote = parseOptionalString(value.quote)?.trim() ?? null;
  if (!passageId && !answer) {
    return { reachable: true, passageId: null, answer: null, quote: null };
  }
  const id = parseString(value.passage_id).trim();
  return {
    reachable: true,
    passageId: id || passageId,
    answer,
    quote,
  };
}

export async function fetchWorkerExtractiveAnswer(
  query: string,
  passages: ExtractivePassageInput[]
): Promise<WorkerExtractiveAnswerResult> {
  const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
  const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';
  if (!passages.length) {
    return { reachable: true, passageId: null, answer: null, quote: null };
  }
  try {
    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/v1/rag/extractive-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({ query, passages }),
      signal: AbortSignal.timeout(Number(process.env['WORKER_RAG_TIMEOUT_MS'] ?? 30_000)),
    });
    if (!response.ok) {
      return { reachable: false, passageId: null, answer: null, quote: null };
    }
    const data: unknown = await response.json();
    const parsed = parseExtractiveAnswerResponse(data);
    if (!parsed) {
      return { reachable: false, passageId: null, answer: null, quote: null };
    }
    return parsed;
  } catch {
    return { reachable: false, passageId: null, answer: null, quote: null };
  }
}
