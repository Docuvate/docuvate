// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
const DEFAULT_NUM_CTX = 2048;
const DEFAULT_NUM_PREDICT = 256;
const DEFAULT_KEEP_ALIVE = '30m';

export function ollamaNumCtx(): number {
  const raw = process.env['OLLAMA_NUM_CTX'];
  if (!raw) {
    return DEFAULT_NUM_CTX;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_NUM_CTX;
}

export function ollamaNumPredict(): number {
  const raw = process.env['OLLAMA_NUM_PREDICT'];
  if (!raw) {
    return DEFAULT_NUM_PREDICT;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_NUM_PREDICT;
}

export function ollamaKeepAlive(): string {
  const raw = process.env['OLLAMA_KEEP_ALIVE'];
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_KEEP_ALIVE;
}

export function ollamaChatIdleTimeoutMs(): number {
  const raw = process.env['OLLAMA_CHAT_IDLE_TIMEOUT_MS'];
  const fallback = 120_000;
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function ollamaThinkingDisabled(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('qwen2') || normalized.startsWith('qwen3');
}

export function buildOllamaChatBody(
  model: string,
  messages: { role: string; content: string }[],
  stream: boolean
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    keep_alive: ollamaKeepAlive(),
    options: {
      num_ctx: ollamaNumCtx(),
      num_predict: ollamaNumPredict(),
      temperature: 0,
      top_p: 1,
    },
  };
  if (ollamaThinkingDisabled(model)) {
    body.think = false;
  }
  return body;
}
