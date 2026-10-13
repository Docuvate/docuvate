// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface CitedChatDocumentContextField {
  key: string;
  value: string;
  confidence: number | null;
}

export interface CitedChatDocumentContextMeta {
  documentId: string;
  title: string;
  documentDate: string | null;
  labels: string[];
  fields: CitedChatDocumentContextField[];
}

const MAX_FIELDS_PER_DOC = 8;
const MAX_LABELS_PER_DOC = 6;

function formatFieldLine(field: CitedChatDocumentContextField): string {
  const conf =
    field.confidence != null && Number.isFinite(field.confidence)
      ? ` conf=${field.confidence.toFixed(2)}`
      : '';
  return `${field.key}=${field.value}${conf}`;
}

/** Compact machine-readable header prepended to passage text for the cited-chat LLM. */
export function formatStructuredDocumentHeader(meta: CitedChatDocumentContextMeta): string {
  const parts: string[] = [`doc=${meta.title}`];
  if (meta.documentDate) {
    parts.push(`date=${meta.documentDate}`);
  }
  if (meta.labels.length > 0) {
    parts.push(`labels=${meta.labels.slice(0, MAX_LABELS_PER_DOC).join('|')}`);
  }
  const fields = meta.fields.slice(0, MAX_FIELDS_PER_DOC);
  if (fields.length > 0) {
    parts.push(`fields=${fields.map(formatFieldLine).join('; ')}`);
  }
  return parts.join(' | ');
}

export function buildPassageWithStructuredContext(
  meta: CitedChatDocumentContextMeta | undefined,
  passageBody: string
): string {
  if (!meta) {
    return passageBody;
  }
  const header = formatStructuredDocumentHeader(meta);
  return `${header}\n---\n${passageBody}`;
}
