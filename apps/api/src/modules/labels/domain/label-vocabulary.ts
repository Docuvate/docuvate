// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  namesAreNearDuplicate,
  normalizeLabelKey,
} from '../../../shared/domain/label-name-similarity.js';
import { cosineSimilarity } from './cosine.js';
import { isBlockedLabelCandidate } from './recommendation-blocklist.js';

export { namesAreNearDuplicate, normalizeLabelKey };

export const GERMAN_BELEGE_TERMS = [
  'Rechnung',
  'Quittung',
  'Mahnung',
  'Vertrag',
  'Lieferschein',
  'Gutschrift',
  'Angebot',
  'Bestellung',
  'Kontoauszug',
  'Versicherung',
  'Bescheid',
  'Protokoll',
  'SEPA-Mandat',
] as const;

const KNOWN_LABEL_KEYS = new Set(GERMAN_BELEGE_TERMS.map((t) => normalizeLabelKey(t)));

const MAX_AD_HOC_LABEL_LEN = 40;

const PDF_PRODUCER_DENY_FRAGMENTS = [
  'pdf-xchange',
  'pdf xchange',
  'adobe',
  'microsoft print',
  'foxit',
  'nitro pdf',
  'pdfelement',
  'creator',
  'producer',
  'ghostscript',
  'wkhtmltopdf',
  'libreoffice',
  'openoffice',
  'pdftk',
  'prince',
  'scanSnap',
  'scansnap',
] as const;

const TEXT_LABEL_HINTS: { pattern: RegExp; label: string }[] = [
  { pattern: /sepa[\s-]*(direct[\s-]*)?debit/i, label: 'SEPA-Mandat' },
  { pattern: /sepa[\s-]*lastschrift[\s-]*mandat/i, label: 'SEPA-Mandat' },
  { pattern: /erteilung\s+eines\s+sepa/i, label: 'SEPA-Mandat' },
  { pattern: /lastschriftmandat/i, label: 'SEPA-Mandat' },
  { pattern: /versicherungs(?:police|schein|nachweis)/i, label: 'Versicherung' },
  { pattern: /steuerbescheid/i, label: 'Bescheid' },
  { pattern: /mahnung(en)?\b/i, label: 'Mahnung' },
];

export const REASON_IN_TEXT = 'Im Dokumenttext erkannt';
export const REASON_IN_TITLE = 'In Titel oder Dateiname';

function isKnownVocabularyLabel(name: string): boolean {
  return KNOWN_LABEL_KEYS.has(normalizeLabelKey(name));
}

function hasRepeatedToken(name: string): boolean {
  const tokens = normalizeLabelKey(name).split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }
  return new Set(tokens).size < tokens.length;
}

function isDenyListedProducerOrMetadata(name: string): boolean {
  const key = normalizeLabelKey(name);
  if (!key) {
    return true;
  }
  return PDF_PRODUCER_DENY_FRAGMENTS.some((frag) => key.includes(frag));
}

function isLikelyEmailOrUrl(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.includes('@') || /https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
}

function isPureNumeric(name: string): boolean {
  return /^[\d\s.,+\-/]+$/.test(name.trim());
}

export function isAcceptableLabelCandidate(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return false;
  }
  const known = isKnownVocabularyLabel(trimmed);
  if (!known && trimmed.length > MAX_AD_HOC_LABEL_LEN) {
    return false;
  }
  if (!known && trimmed.split(/\s+/).length > 4) {
    return false;
  }
  if (isDenyListedProducerOrMetadata(trimmed)) {
    return false;
  }
  if (isLikelyEmailOrUrl(trimmed)) {
    return false;
  }
  if (isPureNumeric(trimmed)) {
    return false;
  }
  if (hasRepeatedToken(trimmed)) {
    return false;
  }
  if (/^\d{5,}/.test(trimmed)) {
    return false;
  }
  return true;
}

export interface DocumentLabelSignal {
  documentId: string;
  title: string;
  filename: string;
  text: string;
  fields: { key: string; value: string }[];
  nonInboxTagIds: string[];
}

export interface NewLabelCandidate {
  name: string;
  score: number;
  reason: string;
  documentIds: string[];
}

export function extractBelegTermsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const term of GERMAN_BELEGE_TERMS) {
    const pattern = new RegExp(`\\b${term.replace('-', '[\\s-]')}\\b`, 'i');
    if (pattern.test(lower)) {
      found.push(term);
    }
  }
  return found;
}

export function inferCanonicalLabelsFromSnippet(
  snippet: string,
  reason: string
): { name: string; reason: string }[] {
  const seen = new Set<string>();
  const out: { name: string; reason: string }[] = [];
  const add = (name: string) => {
    if (!isKnownVocabularyLabel(name) || !isAcceptableLabelCandidate(name)) {
      return;
    }
    const key = normalizeLabelKey(name);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push({ name, reason });
  };

  for (const term of extractBelegTermsFromText(snippet)) {
    add(term);
  }
  for (const hint of TEXT_LABEL_HINTS) {
    if (hint.pattern.test(snippet)) {
      add(hint.label);
    }
  }
  return out;
}

/** Picks the Beleg term that appears in the most cluster snippets; null if none. */
export function inferClusterLabelNameFromSnippets(snippets: string[]): string | null {
  const termDocCounts = new Map<string, number>();
  for (const snippet of snippets) {
    const hits = extractBelegTermsFromText(snippet);
    const seenInDoc = new Set<string>();
    for (const term of hits) {
      const key = normalizeLabelKey(term);
      if (seenInDoc.has(key)) {
        continue;
      }
      seenInDoc.add(key);
      termDocCounts.set(key, (termDocCounts.get(key) ?? 0) + 1);
    }
  }

  let bestName: string | null = null;
  let bestCount = 0;
  for (const term of GERMAN_BELEGE_TERMS) {
    const key = normalizeLabelKey(term);
    const count = termDocCounts.get(key) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestName = term;
    }
  }
  if (bestName) {
    return bestName;
  }

  const combined = snippets.join('\n');
  const canonical = inferCanonicalLabelsFromSnippet(combined, REASON_IN_TEXT);
  return canonical[0]?.name ?? null;
}

export function collectNewLabelCandidates(
  documents: DocumentLabelSignal[],
  existingTagNames: string[],
  dismissedKeys: Set<string>,
  userBlockPhrases: string[] = [],
  userBlockPatterns: string[] = []
): NewLabelCandidate[] {
  const existingKeys = new Set(existingTagNames.map(normalizeLabelKey));
  const counts = new Map<string, { name: string; docIds: Set<string>; reasons: Set<string> }>();

  function conflictsWithExisting(name: string): boolean {
    if (existingKeys.has(normalizeLabelKey(name))) {
      return true;
    }
    return existingTagNames.some((existing) => namesAreNearDuplicate(name, existing));
  }

  function bump(name: string, documentId: string, reason: string) {
    const trimmed = name.trim();
    if (!isKnownVocabularyLabel(trimmed) || !isAcceptableLabelCandidate(trimmed)) {
      return;
    }
    if (isBlockedLabelCandidate(trimmed, userBlockPhrases, userBlockPatterns)) {
      return;
    }
    const key = normalizeLabelKey(trimmed);
    if (!key || conflictsWithExisting(trimmed)) {
      return;
    }
    if (dismissedKeys.has(`new:${key}`)) {
      return;
    }
    const entry = counts.get(key) ?? { name: trimmed, docIds: new Set(), reasons: new Set() };
    entry.docIds.add(documentId);
    entry.reasons.add(reason);
    counts.set(key, entry);
  }

  for (const doc of documents) {
    if (doc.nonInboxTagIds.length > 0) {
      continue;
    }
    for (const hit of inferCanonicalLabelsFromSnippet(doc.text, REASON_IN_TEXT)) {
      bump(hit.name, doc.documentId, hit.reason);
    }
    for (const hit of inferCanonicalLabelsFromSnippet(
      `${doc.title} ${doc.filename}`,
      REASON_IN_TITLE
    )) {
      bump(hit.name, doc.documentId, hit.reason);
    }
  }

  const total = Math.max(documents.length, 1);
  return [...counts.values()]
    .map((entry) => ({
      name: entry.name,
      score: Math.min(0.92, 0.55 + (entry.docIds.size / total) * 0.35),
      reason: [...entry.reasons][0] ?? '',
      documentIds: [...entry.docIds].slice(0, 8),
    }))
    .filter((c) => c.documentIds.length >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export interface TagPairSignal {
  tagId: string;
  name: string;
  centroid: number[];
}

export type MergeRenameSuggestion =
  | {
      kind: 'merge';
      id: string;
      tagIds: [string, string];
      names: [string, string];
      score: number;
      reason: string;
    }
  | {
      kind: 'rename';
      id: string;
      tagId: string;
      fromName: string;
      toName: string;
      score: number;
      reason: string;
    };

function canonicalVocabularyName(name: string): string | null {
  for (const term of GERMAN_BELEGE_TERMS) {
    if (normalizeLabelKey(name) === normalizeLabelKey(term)) {
      return term;
    }
  }
  return null;
}

function renameReason(fromName: string, toName: string): string {
  if (normalizeLabelKey(fromName) === normalizeLabelKey(toName)) {
    return `Schreibweise vereinheitlichen: „${fromName}" → „${toName}"`;
  }
  return `Einheitlicher Beleg-Begriff: „${toName}" (statt „${fromName}")`;
}

function pushRenameIfValid(
  out: MergeRenameSuggestion[],
  dismissedKeys: Set<string>,
  tagId: string,
  fromName: string,
  toName: string,
  score: number,
  reason?: string
): void {
  const from = fromName.trim();
  const to = toName.trim();
  if (!from || !to || from === to) {
    return;
  }
  const renameId = `rename:${tagId}:${normalizeLabelKey(to)}`;
  if (dismissedKeys.has(renameId)) {
    return;
  }
  out.push({
    kind: 'rename',
    id: renameId,
    tagId,
    fromName: from,
    toName: to,
    score,
    reason: reason?.trim() ?? renameReason(from, to),
  });
}

export function suggestMergeAndRename(
  tags: TagPairSignal[],
  dismissedKeys: Set<string>
): MergeRenameSuggestion[] {
  const out: MergeRenameSuggestion[] = [];

  for (const tag of tags) {
    const canonical = canonicalVocabularyName(tag.name);
    if (!canonical) {
      continue;
    }
    pushRenameIfValid(out, dismissedKeys, tag.tagId, tag.name, canonical, 0.78);
  }

  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = tags[i];
      const b = tags[j];
      const idPair = [a.tagId, b.tagId].sort();
      const mergeId = `merge:${idPair[0]}:${idPair[1]}`;
      if (dismissedKeys.has(mergeId)) {
        continue;
      }

      const nameDup = namesAreNearDuplicate(a.name, b.name);
      let sim = 0;
      if (a.centroid.length > 0 && b.centroid.length > 0) {
        sim = cosineSimilarity(a.centroid, b.centroid);
      }

      if (nameDup || sim >= 0.9) {
        out.push({
          kind: 'merge',
          id: mergeId,
          tagIds: [a.tagId, b.tagId],
          names: [a.name, b.name],
          score: Math.min(0.99, nameDup ? 0.88 + sim * 0.1 : sim),
          reason: nameDup
            ? `Sehr ähnliche Namen (${a.name} / ${b.name})`
            : `Embedding-Zentren sehr nah (${String(Math.round(sim * 100))} % Ähnlichkeit)`,
        });
      } else if (sim >= 0.85 && a.name !== b.name) {
        const canonical = pickCanonicalName(a.name, b.name);
        for (const source of [a, b]) {
          if (source.name === canonical) {
            continue;
          }
          pushRenameIfValid(out, dismissedKeys, source.tagId, source.name, canonical, sim * 0.95);
        }
      }
    }
  }

  const seenIds = new Set<string>();
  return out
    .filter((item) => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, 6);
}

function pickCanonicalName(a: string, b: string): string {
  for (const term of GERMAN_BELEGE_TERMS) {
    if (normalizeLabelKey(a) === normalizeLabelKey(term)) {
      return term;
    }
    if (normalizeLabelKey(b) === normalizeLabelKey(term)) {
      return term;
    }
  }
  return a.length <= b.length ? a : b;
}
