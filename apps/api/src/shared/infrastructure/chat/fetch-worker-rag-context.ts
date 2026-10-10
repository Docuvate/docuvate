// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatContext } from '../../domain/ports.js';
import { isRecord, parseString, parseStringArray } from '../database/row-parse.js';
import { workerApiUrl } from '../worker/worker-api-path.js';

function parseWorkerRagResponse(raw: unknown): { contextText: string; chunks: string[] } {
  if (!isRecord(raw)) {
    return { contextText: '', chunks: [] };
  }
  return {
    contextText: parseString(raw.contextText).trim(),
    chunks: parseStringArray(raw.chunks),
  };
}

export interface WorkerRagContextResult {
  contextText: string;
  chunks: string[];
  reachable: boolean;
}

const DEFAULT_RAG_CONTEXT_TIMEOUT_MS = 120_000;

function workerRagContextTimeoutMs(): number {
  const raw = process.env['WORKER_RAG_CONTEXT_TIMEOUT_MS'];
  if (!raw) {
    return DEFAULT_RAG_CONTEXT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RAG_CONTEXT_TIMEOUT_MS;
  }
  return parsed;
}

export async function fetchWorkerRagContext(
  message: string,
  context: DocumentChatContext
): Promise<WorkerRagContextResult> {
  const workerUrl = process.env['WORKER_URL'] ?? 'http://localhost:8000';
  const secret = process.env['WORKER_SECRET'] ?? 'worker-shared-secret';

  try {
    const response = await fetch(workerApiUrl(workerUrl, '/document-chat/rag-context'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Secret': secret,
      },
      body: JSON.stringify({
        message,
        title: context.title,
        filename: context.filename,
        text: context.text,
        fields: context.fields.map((f) => ({ key: f.key, value: f.value })),
      }),
      signal: AbortSignal.timeout(workerRagContextTimeoutMs()),
    });
    if (!response.ok) {
      return { contextText: '', chunks: [], reachable: true };
    }
    const raw: unknown = await response.json();
    const parsed = parseWorkerRagResponse(raw);
    return {
      contextText: parsed.contextText,
      chunks: parsed.chunks,
      reachable: true,
    };
  } catch {
    return { contextText: '', chunks: [], reachable: false };
  }
}
