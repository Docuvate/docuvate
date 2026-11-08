// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type ExtractedField,
  type ExtractionBlock,
  type FieldSuggestionRow,
  normalizeSuggestionDecisionValue,
  parseSuggestionStorageKey,
} from '@docuvate/contracts';

import { isUserConfirmedField, withSavedFieldValue } from './documentFieldValueRowState';

/** At or above this model confidence a value counts as "safe" for one-click bulk confirmation. */
const SAFE_CONFIDENCE = 0.9;

/** `review`: extracted, nobody looked yet. `suggested`: heuristic value not yet a field. */
export type WorkbenchRowState = 'review' | 'suggested' | 'confirmed';

/** Active reject of a concrete field+value on this document (durable). */
export interface SuggestionRejectRef {
  fieldKey: string;
  valueNormalized: string;
  correctionId?: string;
  value?: string;
}

export function suggestionRejectIdentity(fieldKey: string, value: string): string {
  return `${fieldKey}\0${normalizeSuggestionDecisionValue(value)}`;
}

function isRejectedSuggestion(
  fieldKey: string,
  value: string,
  rejects: readonly SuggestionRejectRef[]
): boolean {
  if (rejects.length === 0) return false;
  const id = suggestionRejectIdentity(fieldKey, value);
  return rejects.some(
    (item) => `${item.fieldKey}\0${item.valueNormalized}` === id
  );
}

export interface WorkbenchRow {
  key: string;
  value: string;
  confidence: number | null;
  state: WorkbenchRowState;
}

const STATE_ORDER: Record<WorkbenchRowState, number> = { review: 0, suggested: 1, confirmed: 2 };

/**
 * One ordered work list for the viewer: open extractions first (least confident first), then
 * heuristic suggestions, then values a person already confirmed.
 */
export function workbenchRows(
  fields: readonly ExtractedField[],
  suggestions: readonly FieldSuggestionRow[],
  rejects: readonly SuggestionRejectRef[] = []
): WorkbenchRow[] {
  const rows: WorkbenchRow[] = fields
    .filter((field) => field.value.trim() !== '')
    .filter((field) =>
      isUserConfirmedField(field)
        ? true
        : !isRejectedSuggestion(field.key, field.value, rejects)
    )
    .map((field) => ({
      key: field.key,
      value: field.value,
      confidence: field.confidence ?? null,
      state: isUserConfirmedField(field) ? 'confirmed' : 'review',
    }));
  for (const suggestion of suggestions) {
    if (rows.some((row) => row.key === suggestion.key)) continue;
    if (isRejectedSuggestion(suggestion.key, suggestion.value, rejects)) continue;
    rows.push({
      key: suggestion.key,
      value: suggestion.value,
      confidence: suggestion.confidence ?? null,
      state: 'suggested',
    });
  }
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const byState = STATE_ORDER[a.row.state] - STATE_ORDER[b.row.state];
      if (byState !== 0) return byState;
      if (a.row.state !== 'confirmed') {
        const byConfidence = (a.row.confidence ?? 0) - (b.row.confidence ?? 0);
        if (byConfidence !== 0) return byConfidence;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

export function openWorkbenchRowCount(rows: readonly WorkbenchRow[]): number {
  return rows.filter((row) => row.state !== 'confirmed').length;
}

/** Extracted (not heuristic) values a person can confirm in one go. */
export function safeConfirmKeys(rows: readonly WorkbenchRow[]): string[] {
  return rows
    .filter((row) => row.state === 'review' && (row.confidence ?? 0) >= SAFE_CONFIDENCE)
    .map((row) => row.key);
}

export function confirmFieldKeys(
  fields: readonly ExtractedField[],
  keys: ReadonlySet<string>
): ExtractedField[] {
  return fields.map((field) =>
    keys.has(field.key) ? { ...field, confidence: 1, userConfirmed: true } : field
  );
}

/**
 * "The value is right, the field is wrong": moves the value to `toKey` (recorded as a
 * correction there) and drops it from `fromKey`.
 */
export function reassignFieldValue(
  fields: readonly ExtractedField[],
  fromKey: string,
  toKey: string
): ExtractedField[] {
  const source = fields.find((field) => field.key === fromKey);
  if (!source || fromKey === toKey) return [...fields];
  const rest = fields.filter((field) => field.key !== fromKey);
  return withSavedFieldValue(rest, toKey, source.value);
}

/** Turns a heuristic suggestion into a confirmed field (drops its `suggestion:` storage row). */
export function acceptSuggestedField(
  fields: readonly ExtractedField[],
  key: string,
  value: string
): ExtractedField[] {
  const kept = fields.filter((field) => {
    const suggestionSemantic = parseSuggestionStorageKey(field.key);
    return suggestionSemantic !== key && field.key !== key;
  });
  return [...kept, { key, value, confidence: 0.9, userConfirmed: true }];
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** OCR blocks whose text contains the value, so the viewer can show where it came from. */
export function blocksContainingValue(
  blocks: readonly ExtractionBlock[],
  value: string
): ExtractionBlock[] {
  const needle = normalize(value);
  if (needle.length < 2) return [];
  return blocks.filter((block) => normalize(block.text).includes(needle));
}

/** Next document in the review queue after the current one (wraps to the first other item). */
export function nextReviewDocumentId(
  items: readonly { documentId: string }[],
  currentId: string
): string | null {
  const index = items.findIndex((item) => item.documentId === currentId);
  const ordered = index < 0 ? items : [...items.slice(index + 1), ...items.slice(0, index)];
  return ordered.find((item) => item.documentId !== currentId)?.documentId ?? null;
}
