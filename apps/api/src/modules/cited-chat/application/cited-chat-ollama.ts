import { buildOllamaChatBody } from '../../../shared/infrastructure/chat/ollama-chat-options.js';
import {
  ollamaChatBaseUrl,
  ollamaChatModel,
  ollamaChatTimeoutMs,
} from '../../../shared/infrastructure/chat/ollama-chat-request.js';
import { streamOllamaChat } from '../../../shared/infrastructure/chat/ollama-stream-chat.js';

import type { CitedAnswerJson } from '../domain/cited-answer-json.js';

export type { CitedClaimJson, CitedAnswerJson } from '../domain/cited-answer-json.js';

const ANSWER_JSON_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          source: { type: 'string' },
          quote: { type: 'string' },
          citations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                quote: { type: 'string' },
              },
              required: ['source', 'quote'],
            },
          },
        },
        required: ['text'],
      },
    },
  },
  required: ['claims'],
};

export function buildCitedChatSystemPrompt(passages: Array<{ label: string; text: string }>): string {
  const blocks = passages
    .map((p) => `[${p.label}]\n${p.text}`)
    .join('\n\n');
  return [
    'Du bist ein Assistent für Docuvate. Antworte nur mit gültigem JSON (kein Markdown).',
    'Format: {"claims":[{"text":"...","source":"S1","quote":"..."}]}',
    'Jeder claim: text = kurzer Antwortsatz auf Deutsch. Pro dokument oder pro Fakt ein eigener claim (nicht mehrere Dokumente in einem Satz mischen).',
    'Zitat: source = exakt das Quellenlabel (z. B. S1); quote = wörtlich aus dieser Quelle, höchstens 10 Wörter. Mehrere Zitate: citations:[{source,quote},...] und jede Zahl/IBAN im text muss in einem der quotes vorkommen.',
    'Erfinde nichts. Fehlen passende Quellen, gib "claims":[] zurück.',
    'Beispiel:',
    '{"claims":[{"text":"Die Miete ist bis zum 3. Werktag fällig.","source":"S1","quote":"bis zum 3. Werktag"}]}',
    'Quellen:',
    blocks || '(keine)',
  ].join('\n');
}

export async function requestCitedAnswerFromOllama(
  userMessage: string,
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  options?: {
    onToken?: (partialJson: string) => void | Promise<void>;
    shouldAbort?: () => boolean | Promise<boolean>;
  }
): Promise<{ ok: true; parsed: CitedAnswerJson } | { ok: false; detail: string }> {
  const model = ollamaChatModel();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-2),
    { role: 'user', content: userMessage },
  ];

  if (options?.onToken) {
    const streamResult = await streamOllamaChat({
      messages,
      extraBody: { format: ANSWER_JSON_SCHEMA, think: false },
      onToken: async (_token, fullText) => {
        await options.onToken?.(fullText);
      },
      shouldAbort: options.shouldAbort ?? (() => false),
    });
    if ('failure' in streamResult) {
      if (streamResult.failure.kind === 'aborted') {
        return { ok: false, detail: 'cancelled' };
      }
      const detail =
        streamResult.failure.kind === 'http_error'
          ? `HTTP ${streamResult.failure.status}`
          : streamResult.failure.kind;
      return { ok: false, detail };
    }
    return parseCitedAnswerJson(streamResult.content);
  }

  const body = {
    ...buildOllamaChatBody(model, messages, false),
    format: ANSWER_JSON_SCHEMA,
    think: false,
  };
  try {
    const response = await fetch(`${ollamaChatBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ollamaChatTimeoutMs()),
    });
    if (!response.ok) {
      return { ok: false, detail: `HTTP ${response.status}` };
    }
    const data = (await response.json()) as { message?: { content?: string } };
    const raw = data.message?.content?.trim() ?? '';
    if (!raw) {
      return { ok: false, detail: 'empty model response' };
    }
    return parseCitedAnswerJson(raw);
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

function parseCitedAnswerJson(
  raw: string
): { ok: true; parsed: CitedAnswerJson } | { ok: false; detail: string } {
  try {
    const parsed = JSON.parse(raw) as CitedAnswerJson;
    if (!Array.isArray(parsed.claims)) {
      return { ok: false, detail: 'invalid claims array' };
    }
    return { ok: true, parsed };
  } catch {
    return { ok: false, detail: 'invalid json response' };
  }
}
