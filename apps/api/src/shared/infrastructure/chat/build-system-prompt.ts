import type { DocumentChatContext } from '../../domain/ports.js';

function qwen3ThinkingDisabledPrefix(model: string): string {
  const normalized = model.trim().toLowerCase();
  if (normalized.startsWith('qwen3')) {
    return '/no_think\n';
  }
  return '';
}

export function buildDocumentRagSystemPrompt(
  context: DocumentChatContext,
  ragContext: string,
  options?: { ollamaModel?: string }
): string {
  const fields =
    context.fields.length > 0
      ? context.fields.map((f) => `- ${f.key}: ${f.value}`).join('\n')
      : '(keine strukturierten Felder)';
  const excerpts = ragContext.trim() || '(kein passender OCR-Ausschnitt — nur Felder nutzen)';
  const model = options?.ollamaModel ?? '';
  const prefix = qwen3ThinkingDisabledPrefix(model);
  return [
    prefix,
    'Du bist ein Assistent für Docuvate. Beantworte Fragen ausschließlich auf Basis der Dokumentausschnitte und extrahierten Felder unten.',
    'Antworte auf Deutsch, knapp und sachlich (2–6 Sätze). Erfinde nichts.',
    'Wenn die Information nicht in den Ausschnitten oder Feldern steht, antworte wörtlich: „Dazu steht im Dokument nichts.“',
    'Nenne am Ende in Klammern die wichtigste Quellenstelle, z. B. (Quelle: OCR-Ausschnitt 2) oder (Quelle: Feld „Betrag“).',
    `Titel: ${context.title}`,
    `Datei: ${context.filename}`,
    'Extrahierte Felder:',
    fields,
    'Relevante OCR-Ausschnitte:',
    excerpts,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDocumentSystemPrompt(context: DocumentChatContext): string {
  const fields =
    context.fields.length > 0
      ? context.fields.map((f) => `- ${f.key}: ${f.value}`).join('\n')
      : '(keine strukturierten Felder)';
  return [
    'Du bist ein Assistent für Docuvate. Beantworte Fragen nur auf Basis des Dokuments.',
    'Antworte auf Deutsch, knapp und sachlich.',
    `Titel: ${context.title}`,
    `Datei: ${context.filename}`,
    'Extrahierte Felder:',
    fields,
    'OCR-Text:',
    context.text.slice(0, 12000) || '(noch kein Text)',
  ].join('\n');
}
