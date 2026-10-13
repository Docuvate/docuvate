// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type CitedAnswerJson, parseCitedAnswerJson } from '../domain/cited-answer-json.js';
import {
  postDocumentChatLlm,
  resolveCitedChatLlmConfig,
  streamDocumentChatLlm,
  type DocumentChatLlmRuntimeConfig,
} from './cited-chat-llm.js';

export type { CitedAnswerJson, CitedClaimJson } from '../domain/cited-answer-json.js';

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

const CITED_CHAT_INSTRUCTIONS_DE = [
  'Du bist Docuvate-Assistent. Antworte nur mit gültigem JSON (kein Markdown).',
  'Format: {"claims":[{"text":"...","source":"S1","quote":"..."}]}',
  'Antwortsätze in der Sprache des Nutzers (Deutsch oder Englisch). Ein Claim pro Dokument oder Fakt.',
  'Zitat: source = exakt das Quellenlabel; quote = wörtlich aus der Quelle, höchstens 10 Wörter.',
  'Prüfe Selbstständig: Wenn die Quellen die Frage nicht beantworten, gib "claims":[] zurück.',
  'Erfinde nichts. Zahlen/IBAN im text müssen in einem quote vorkommen.',
].join(' ');

const CITED_CHAT_INSTRUCTIONS_EN = [
  'You are the Docuvate assistant. Reply with valid JSON only (no Markdown).',
  'Format: {"claims":[{"text":"...","source":"S1","quote":"..."}]}',
  'Answer in the user language. One claim per document or fact.',
  'Citations: source must match the passage label; quote is verbatim, at most 10 words.',
  'Self-check: if passages do not answer the question, return "claims":[]',
  'Do not invent facts. Numbers in text must appear in a quote.',
].join(' ');

export function buildCitedChatSystemPrompt(
  passages: { label: string; text: string }[],
  locale: 'de' | 'en' = 'de'
): string {
  const blocks = passages.map((p) => `[${p.label}]\n${p.text}`).join('\n\n');
  const instructions = locale === 'en' ? CITED_CHAT_INSTRUCTIONS_EN : CITED_CHAT_INSTRUCTIONS_DE;
  const example =
    locale === 'en'
      ? '{"claims":[{"text":"Rent is due by the 3rd business day.","source":"S1","quote":"by the 3rd business day"}]}'
      : '{"claims":[{"text":"Die Miete ist bis zum 3. Werktag fällig.","source":"S1","quote":"bis zum 3. Werktag"}]}';
  return [instructions, `Example: ${example}`, 'Sources:', blocks || '(none)'].join('\n');
}

export async function requestCitedAnswerFromOllama(
  userMessage: string,
  systemPrompt: string,
  history: { role: string; content: string }[],
  options?: {
    locale?: 'de' | 'en';
    cloudBaseUrl?: string | null;
    cloudApiKey?: string | null;
    cloudModel?: string | null;
    onToken?: (partialJson: string) => void | Promise<void>;
    shouldAbort?: () => boolean | Promise<boolean>;
  }
): Promise<{ ok: true; parsed: CitedAnswerJson } | { ok: false; detail: string }> {
  const config = resolveCitedChatLlmConfig({
    cloudBaseUrl: options?.cloudBaseUrl,
    cloudApiKey: options?.cloudApiKey,
    cloudModel: options?.cloudModel,
  });
  if (!config) {
    return { ok: false, detail: 'llm_not_configured' };
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-2),
    { role: 'user', content: userMessage },
  ];

  if (options?.onToken) {
    const streamResult = await streamDocumentChatLlm({
      config,
      messages,
      responseFormat: ANSWER_JSON_SCHEMA,
      onToken: async (_token, fullText) => {
        await options.onToken?.(fullText);
      },
      shouldAbort: options.shouldAbort ?? (() => false),
    });
    if ('failure' in streamResult) {
      if (streamResult.failure.kind === 'aborted') {
        return { ok: false, detail: 'cancelled' };
      }
      return { ok: false, detail: streamResult.failure.kind };
    }
    return parseCitedAnswerJsonResponse(streamResult.content);
  }

  const posted = await postDocumentChatLlm(config, messages, ANSWER_JSON_SCHEMA);
  if (!posted.ok) {
    return posted;
  }
  return parseCitedAnswerJsonResponse(posted.content);
}

export async function phraseLibraryStatsWithLlm(input: {
  locale: 'de' | 'en';
  userQuestion: string;
  statsPayload: Record<string, unknown>;
  cloudBaseUrl?: string | null;
  cloudApiKey?: string | null;
  cloudModel?: string | null;
}): Promise<string | null> {
  const config = resolveCitedChatLlmConfig({
    cloudBaseUrl: input.cloudBaseUrl,
    cloudApiKey: input.cloudApiKey,
    cloudModel: input.cloudModel,
  });
  if (!config) {
    return null;
  }
  const system =
    input.locale === 'en'
      ? 'You phrase library statistics for the user. Use the JSON facts only. Short sentences or a bullet list. No invented numbers.'
      : 'Du formulierst Bibliotheks-Statistiken für den Nutzer. Nutze nur die JSON-Fakten. Kurze Sätze oder Aufzählung. Keine erfundenen Zahlen.';
  const user = JSON.stringify({
    question: input.userQuestion,
    facts: input.statsPayload,
  });
  const posted = await postDocumentChatLlm(config, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
  if (!posted.ok) {
    return null;
  }
  return posted.content.trim();
}

function parseCitedAnswerJsonResponse(
  raw: string
): { ok: true; parsed: CitedAnswerJson } | { ok: false; detail: string } {
  try {
    const parsed = parseCitedAnswerJson(JSON.parse(raw));
    if (!parsed) {
      return { ok: false, detail: 'invalid claims array' };
    }
    return { ok: true, parsed };
  } catch {
    return { ok: false, detail: 'invalid json response' };
  }
}

// re-export for tests
export type { DocumentChatLlmRuntimeConfig };
