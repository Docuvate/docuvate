// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { normalizeSearchText } from '../../search/domain/normalize-search-text.js';

/** Tenant label names that appear in the user question (longest match first). */
export function tenantLabelsMentionedInQuery(
  query: string,
  tenantLabelNames: readonly string[]
): string[] {
  const normalizedQuery = normalizeSearchText(query);
  const matched: string[] = [];
  for (const rawName of tenantLabelNames) {
    const name = rawName.trim();
    const normalizedName = normalizeSearchText(name);
    if (normalizedName.length >= 3 && normalizedQuery.includes(normalizedName)) {
      matched.push(name);
    }
  }
  return [...new Set(matched)].sort((a, b) => b.length - a.length);
}

export function libraryTenantLabelMatchBoost(input: {
  query: string;
  tenantLabelNames: readonly string[];
  filename: string;
  title: string;
  body: string;
  documentLabelNames: readonly string[];
}): number {
  const mentioned = tenantLabelsMentionedInQuery(input.query, input.tenantLabelNames);
  if (mentioned.length === 0) {
    return 0;
  }
  const docLabelSet = new Set(input.documentLabelNames.map((name) => normalizeSearchText(name)));
  for (const label of mentioned) {
    if (docLabelSet.has(normalizeSearchText(label))) {
      return 0.25;
    }
  }
  const corpus = normalizeSearchText(
    [input.filename, input.title, input.body].join('\n')
  );
  if (mentioned.some((label) => corpus.includes(normalizeSearchText(label)))) {
    return 0.15;
  }
  return 0;
}

export function documentMatchesTenantLabelsInQuery(input: {
  query: string;
  tenantLabelNames: readonly string[];
  filename: string;
  title: string;
  body: string;
  documentLabelNames: readonly string[];
}): boolean {
  const mentioned = tenantLabelsMentionedInQuery(input.query, input.tenantLabelNames);
  if (mentioned.length === 0) {
    return true;
  }
  const docLabelSet = new Set(input.documentLabelNames.map((name) => normalizeSearchText(name)));
  if (mentioned.some((label) => docLabelSet.has(normalizeSearchText(label)))) {
    return true;
  }
  const corpus = normalizeSearchText(
    [input.filename, input.title, input.body].join('\n')
  );
  return mentioned.some((label) => corpus.includes(normalizeSearchText(label)));
}
