// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatThreadDto, DocumentDto, TagDto } from '@docuvate/contracts';
import { semanticFieldKey } from '@docuvate/contracts';

const AMOUNT_SEMANTICS = new Set(['amount', 'betrag', 'summe', 'total', 'brutto', 'bruttobetrag']);
const CONTRACT_END_SEMANTICS = new Set(['contract_end', 'vertragsende', 'end_date', 'laufzeit_ende']);

export interface GlobalChatSuggestionChip {
  id: string;
  text: string;
}

export interface GlobalChatSuggestionsResult {
  chips: GlobalChatSuggestionChip[];
  recentQuestions: string[];
}

function countDocumentsByTag(documents: DocumentDto[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const doc of documents) {
    for (const tag of doc.tags) {
      if (tag.isInbox) continue;
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }
  return counts;
}

function tagWithMostDocuments(tags: TagDto[], counts: Map<string, number>): TagDto | null {
  let best: TagDto | null = null;
  let bestCount = 0;
  for (const tag of tags) {
    if (tag.isInbox) continue;
    const c = counts.get(tag.id) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      best = tag;
    }
  }
  return bestCount >= 1 ? best : null;
}

function documentsWithAmountForTag(documents: DocumentDto[], tagId: string): number {
  let n = 0;
  for (const doc of documents) {
    if (!doc.tags.some((t) => t.id === tagId)) continue;
    const fields = doc.extraction?.fields ?? [];
    const hasAmount = fields.some((f) => {
      const sem = semanticFieldKey(f);
      return AMOUNT_SEMANTICS.has(sem) && f.value.trim().length > 0;
    });
    if (hasAmount) n += 1;
  }
  return n;
}

function findContractEndLabel(documents: DocumentDto[]): { label: string; value: string } | null {
  for (const doc of documents) {
    const fields = doc.extraction?.fields ?? [];
    for (const field of fields) {
      const sem = semanticFieldKey(field);
      if (!CONTRACT_END_SEMANTICS.has(sem)) continue;
      const value = field.value.trim();
      if (value.length === 0) continue;
      return { label: doc.title.trim() || doc.filename, value };
    }
  }
  return null;
}

function buildAmountCostQuestion(tagName: string): string {
  return `Was kostet ${tagName}?`;
}

function buildSumQuestion(tagName: string, year: number): string {
  return `Summe aller ${tagName} ${String(year)}`;
}

function buildContractEndQuestion(contractLabel: string): string {
  return `Wann endet ${contractLabel}?`;
}

export function buildGlobalChatSuggestions(input: {
  tags: TagDto[];
  documents: DocumentDto[];
  threads: DocumentChatThreadDto[];
  now?: Date;
}): GlobalChatSuggestionsResult {
  const counts = countDocumentsByTag(input.documents);
  const topTag = tagWithMostDocuments(input.tags, counts);
  const year = (input.now ?? new Date()).getFullYear();

  const chips: GlobalChatSuggestionChip[] = [];

  if (topTag) {
    chips.push({
      id: 'cost-top-label',
      text: buildAmountCostQuestion(topTag.name),
    });
    if (documentsWithAmountForTag(input.documents, topTag.id) >= 2) {
      chips.push({
        id: 'sum-top-label-year',
        text: buildSumQuestion(topTag.name, year),
      });
    }
  }

  const contract = findContractEndLabel(input.documents);
  if (contract) {
    chips.push({
      id: 'contract-end',
      text: buildContractEndQuestion(contract.label),
    });
  }

  const limitedChips = chips.slice(0, 3);

  const recentQuestions: string[] = [];
  const seen = new Set<string>();
  for (const thread of input.threads) {
    const preview = thread.lastMessagePreview?.trim();
    if (!preview || preview.length < 4) continue;
    const key = preview.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recentQuestions.push(preview);
    if (recentQuestions.length >= 3) break;
  }

  return { chips: limitedChips, recentQuestions };
}
