import { buildOllamaChatBody } from '../../../shared/infrastructure/chat/ollama-chat-options.js';
import { ollamaChatBaseUrl, ollamaChatModel, ollamaChatTimeoutMs } from '../../../shared/infrastructure/chat/ollama-chat-request.js';

export interface CitedClaimJson {
  text: string;
  source: string;
  quote: string;
}

export interface CitedAnswerJson {
  claims: CitedClaimJson[];
}

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
        },
        required: ['text', 'source', 'quote'],
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
    'Du bist ein Assistent für Docuvate. Antworte nur mit JSON.',
    'Gib ein Objekt mit claims zurück. Jeder claim hat text (kurzer Satz), source (Quellenlabel wie S1) und quote (wörtliches Zitat, höchstens 10 Wörter aus der Quelle).',
    'Erfinde nichts. Fehlen passende Quellen, gib claims als leeres Array zurück.',
    'Quellen:',
    blocks || '(keine)',
  ].join('\n');
}

export async function requestCitedAnswerFromOllama(
  userMessage: string,
  systemPrompt: string,
  history: Array<{ role: string; content: string }>
): Promise<{ ok: true; parsed: CitedAnswerJson } | { ok: false; detail: string }> {
  const model = ollamaChatModel();
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-2),
    { role: 'user', content: userMessage },
  ];
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
    const parsed = JSON.parse(raw) as CitedAnswerJson;
    if (!Array.isArray(parsed.claims)) {
      return { ok: false, detail: 'invalid claims array' };
    }
    return { ok: true, parsed };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
