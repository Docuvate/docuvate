// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractedField, FieldSuggestionRow } from '@docuvate/contracts';

/**
 * Structuring is the lasting working state of a document, not a stage it passes through.
 * Each aspect reports what is left to do, from evidence only:
 *
 * - `pending` / `processing` / `failed`: technical processing (worker status).
 * - `open`: concrete open items exist (count when known): suggestions, unconfirmed values,
 *   missing text or label.
 * - `no_open_items`: processing ran and nothing is flagged, but no person confirmed it.
 * - `confirmed`: a person confirmed every item (only where the data records that).
 * - `unavailable`: this aspect does not exist for the document (e.g. no layout for a photo).
 * - `unknown`: the current payload does not carry the evidence (e.g. fields in list rows).
 */
export const STRUCTURING_ASPECTS = ['ocr', 'labels', 'layout', 'fields'] as const;
export type StructuringAspect = (typeof STRUCTURING_ASPECTS)[number];

export type AspectState =
  | 'pending'
  | 'processing'
  | 'failed'
  | 'open'
  | 'no_open_items'
  | 'confirmed'
  | 'unavailable'
  | 'unknown';

export interface AspectStatus {
  aspect: StructuringAspect;
  state: AspectState;
  /** Open items when countable; null when the state has no meaningful count. */
  open: number | null;
}

type AspectDocument = Pick<
  DocumentDto,
  'status' | 'tags' | 'tagSuggestions' | 'layoutIrAvailable' | 'extraction'
>;

interface FieldEvidence {
  fields: readonly Pick<ExtractedField, 'value' | 'userConfirmed'>[];
  suggestions: readonly FieldSuggestionRow[];
}

function technicalState(status: DocumentDto['status']): AspectState | null {
  switch (status) {
    case 'uploaded':
    case 'queued':
      return 'pending';
    case 'extracting':
      return 'processing';
    case 'failed':
      return 'failed';
    case 'ready':
      return null;
  }
}

/** Layout and fields come out of the same run: after a failed read they were never produced. */
function dependentState(status: DocumentDto['status']): AspectState | null {
  const technical = technicalState(status);
  return technical === 'failed' ? 'pending' : technical;
}

function ocrStatus(doc: AspectDocument): AspectStatus {
  const technical = technicalState(doc.status);
  if (technical) return { aspect: 'ocr', state: technical, open: null };
  if (!doc.extraction) return { aspect: 'ocr', state: 'unknown', open: null };
  // No OCR confirmation is recorded anywhere, so text is never reported as confirmed.
  return doc.extraction.text.trim() === ''
    ? { aspect: 'ocr', state: 'open', open: null }
    : { aspect: 'ocr', state: 'no_open_items', open: null };
}

/** Labels do not depend on OCR: a person can label a failed or waiting document. */
function labelStatus(doc: AspectDocument): AspectStatus {
  const assigned = new Set(doc.tags.map((tag) => tag.id));
  const suggestions = (doc.tagSuggestions ?? []).filter((item) => !assigned.has(item.tag.id));
  if (suggestions.length > 0) {
    return { aspect: 'labels', state: 'open', open: suggestions.length };
  }
  const hasLabel = doc.tags.some((tag) => !tag.isInbox);
  const inInbox = doc.tags.some((tag) => tag.isInbox);
  if (!hasLabel || inInbox) return { aspect: 'labels', state: 'open', open: null };
  return { aspect: 'labels', state: 'no_open_items', open: null };
}

function layoutStatus(doc: AspectDocument): AspectStatus {
  const technical = dependentState(doc.status);
  if (technical) return { aspect: 'layout', state: technical, open: null };
  const available = doc.extraction?.layoutIrAvailable ?? doc.layoutIrAvailable;
  if (available === true) return { aspect: 'layout', state: 'no_open_items', open: null };
  if (available === false) return { aspect: 'layout', state: 'unavailable', open: null };
  return { aspect: 'layout', state: 'unknown', open: null };
}

function fieldStatus(doc: AspectDocument, evidence: FieldEvidence | null): AspectStatus {
  const technical = dependentState(doc.status);
  if (technical) return { aspect: 'fields', state: technical, open: null };
  if (!evidence) return { aspect: 'fields', state: 'unknown', open: null };
  const values = evidence.fields.filter((field) => field.value.trim() !== '');
  const open =
    values.filter((field) => field.userConfirmed !== true).length + evidence.suggestions.length;
  if (open > 0) return { aspect: 'fields', state: 'open', open };
  if (values.length === 0) return { aspect: 'fields', state: 'no_open_items', open: null };
  return { aspect: 'fields', state: 'confirmed', open: null };
}

/** Per-aspect state. Pass field evidence only where recognized fields are loaded (viewer). */
export function structuringAspects(
  doc: AspectDocument,
  evidence: FieldEvidence | null = null
): AspectStatus[] {
  return [ocrStatus(doc), labelStatus(doc), layoutStatus(doc), fieldStatus(doc, evidence)];
}

export function aspectNeedsWork(status: AspectStatus): boolean {
  return status.state === 'open' || status.state === 'failed';
}

/** Sum of countable open items (aspects without a count add one). */
export function openAspectItems(statuses: readonly AspectStatus[]): number {
  return statuses
    .filter((status) => status.state === 'open')
    .reduce((sum, status) => sum + (status.open ?? 1), 0);
}
