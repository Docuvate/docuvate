// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChatStatsOperation } from './chat-intent-prototypes.schema.js';

export interface FormatStatsAnswerInput {
  locale: 'de' | 'en';
  operation: ChatStatsOperation;
  labelName: string | null;
  count: number | null;
  documents: { id: string; title: string; filename: string }[];
}

function docLink(row: { id: string; title: string; filename: string }): string {
  const label = row.title.trim() || row.filename.trim() || row.id;
  return `[${label}](/documents/${row.id})`;
}

export function formatStatsAnswer(input: FormatStatsAnswerInput): string {
  const { locale, operation, labelName, count, documents } = input;
  if (locale === 'en') {
    switch (operation) {
      case 'count_total':
        return `You have **${String(count ?? 0)}** documents in your library.`;
      case 'count_ready':
        return `**${String(count ?? 0)}** documents are ready.`;
      case 'count_by_label':
        return `You have **${String(count ?? 0)}** documents with label “${labelName ?? '?'}”.`;
      case 'list_by_label':
        if (documents.length === 0) {
          return `No documents with label “${labelName ?? '?'}”.`;
        }
        return `Documents with label “${labelName ?? '?'}”:\n\n${documents.map((d) => `- ${docLink(d)}`).join('\n')}`;
      default: {
        const exhaustive: never = operation;
        throw new Error(String(exhaustive));
      }
    }
  }

  switch (operation) {
    case 'count_total':
      return `Sie haben **${String(count ?? 0)}** Dokumente in Ihrer Bibliothek.`;
    case 'count_ready':
      return `**${String(count ?? 0)}** Dokumente sind fertig verarbeitet.`;
    case 'count_by_label':
      return `Sie haben **${String(count ?? 0)}** Dokumente mit dem Label „${labelName ?? '?'}“.`;
    case 'list_by_label':
      if (documents.length === 0) {
        return `Keine Dokumente mit dem Label „${labelName ?? '?'}“.`;
      }
      return `Dokumente mit dem Label „${labelName ?? '?'}“:\n\n${documents.map((d) => `- ${docLink(d)}`).join('\n')}`;
    default: {
      const exhaustive: never = operation;
      throw new Error(String(exhaustive));
    }
  }
}
