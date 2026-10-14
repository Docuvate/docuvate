// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';

/** Library questions that should be answered from retrieved text without relying on the LLM. */
export function isLibraryAmountLookupQuestion(userMessage: string): boolean {
  const normalized = normalizeSearchText(userMessage);
  if (!normalized.trim()) {
    return false;
  }
  const asksAmount =
    /(wie hoch|wie viel|wieviel|betrag|summe|gesamtbrutto|gesamt brutto|nettoentgelt|netto|lohnsteuer|insgesamt|eur\b|€)/.test(
      normalized
    );
  const asksWhen = /(wann|datum|bis wann)/.test(normalized);
  return asksAmount && !asksWhen;
}
