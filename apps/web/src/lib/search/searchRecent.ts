// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  parseJsonRecentDocuments,
  parseJsonStringArray,
  type RecentDocumentEntry,
} from '../jsonStorage';

const RECENT_SEARCHES_KEY = 'docuvate.recentSearches';
const RECENT_DOCS_KEY = 'docuvate.recentDocuments';

export type { RecentDocumentEntry };

export function readRecentSearches(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${RECENT_SEARCHES_KEY}:${userId}`);
    return raw ? parseJsonStringArray(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(userId: string, query: string): void {
  const q = query.trim();
  if (!q) return;
  const prev = readRecentSearches(userId).filter((s) => s !== q);
  const next = [q, ...prev].slice(0, 8);
  localStorage.setItem(`${RECENT_SEARCHES_KEY}:${userId}`, JSON.stringify(next));
}

export function readRecentDocuments(userId: string): RecentDocumentEntry[] {
  try {
    const raw = localStorage.getItem(`${RECENT_DOCS_KEY}:${userId}`);
    return raw ? parseJsonRecentDocuments(raw) : [];
  } catch {
    return [];
  }
}

export function pushRecentDocument(userId: string, doc: { id: string; title: string }): void {
  const prev = readRecentDocuments(userId).filter((d) => d.id !== doc.id);
  const next: RecentDocumentEntry[] = [
    { id: doc.id, title: doc.title, openedAt: new Date().toISOString() },
    ...prev,
  ].slice(0, 8);
  localStorage.setItem(`${RECENT_DOCS_KEY}:${userId}`, JSON.stringify(next));
}
