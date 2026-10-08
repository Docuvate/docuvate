import { isPlausibleExtractedDateValue } from './extracted-field-date.js';

export type ExtractedFieldRow = {
  key: string;
  value: string;
  confidence?: number;
  tagId?: string;
};

const LABEL_STORAGE_PREFIX = /^label:([0-9a-f-]{36}):(.+)$/i;
const GLOBAL_STORAGE_PREFIX = /^global:([a-z0-9_]+)$/i;

/** Maps catalog / heuristic keys to one semantic slot (e.g. date + datum). */
const SEMANTIC_ALIASES: Record<string, string> = {
  date: 'date',
  datum: 'date',
  documentdate: 'date',
  document_date: 'date',
  vendor: 'vendor',
  absender: 'vendor',
  supplier: 'vendor',
  lieferant: 'vendor',
  amount: 'amount',
  betrag: 'amount',
  total: 'amount',
  summe: 'amount',
  iban: 'iban',
  reference: 'reference',
  verwendungszweck: 'reference',
  invoicenumber: 'invoicenumber',
  rechnungsnummer: 'invoicenumber',
};

type FieldTier = 'label' | 'global' | 'plain';

function normalizeFieldKey(key: string): string {
  return key.trim().toLowerCase().replace(/[_-]+/g, '');
}

function baseFieldKey(field: ExtractedFieldRow): string {
  const global = GLOBAL_STORAGE_PREFIX.exec(field.key);
  if (global) {
    return global[1]!;
  }
  const label = LABEL_STORAGE_PREFIX.exec(field.key);
  if (label) {
    return label[2]!;
  }
  return field.key;
}

export function semanticFieldKey(field: ExtractedFieldRow): string {
  const normalized = normalizeFieldKey(baseFieldKey(field));
  return SEMANTIC_ALIASES[normalized] ?? normalized;
}

/** Omit date/datum semantic rows whose value is not a parseable calendar date. */
export function omitInvalidDateExtractedFields<T extends ExtractedFieldRow>(fields: T[]): T[] {
  return fields.filter((field) => {
    if (semanticFieldKey(field) !== 'date') {
      return true;
    }
    return isPlausibleExtractedDateValue(field.value);
  });
}

function fieldTier(field: ExtractedFieldRow): FieldTier {
  if (LABEL_STORAGE_PREFIX.test(field.key) || field.tagId) {
    return 'label';
  }
  if (GLOBAL_STORAGE_PREFIX.test(field.key)) {
    return 'global';
  }
  return 'plain';
}

const TIER_RANK: Record<FieldTier, number> = {
  label: 3,
  global: 2,
  plain: 1,
};

function pickPreferredField<T extends ExtractedFieldRow>(current: T, candidate: T): T {
  const currentRank = TIER_RANK[fieldTier(current)];
  const candidateRank = TIER_RANK[fieldTier(candidate)];
  if (candidateRank !== currentRank) {
    return candidateRank > currentRank ? candidate : current;
  }
  const currentConfidence = current.confidence ?? 0;
  const candidateConfidence = candidate.confidence ?? 0;
  if (candidateConfidence !== currentConfidence) {
    return candidateConfidence > currentConfidence ? candidate : current;
  }
  return current;
}

/**
 * One row per semantic field in shared (global/plain) scope; label-scoped fields stay per tag.
 * When a label defines the same semantic key as a global field, the label row wins and the shared row is dropped.
 */
export function dedupeExtractedFields<T extends ExtractedFieldRow>(fields: T[]): T[] {
  const sanitized = omitInvalidDateExtractedFields(fields);
  if (sanitized.length <= 1) {
    return sanitized;
  }

  const labelSemantics = new Set<string>();
  for (const field of sanitized) {
    if (fieldTier(field) !== 'label') {
      continue;
    }
    labelSemantics.add(semanticFieldKey(field));
  }

  const sharedBySemantic = new Map<string, T>();
  const labelBySlot = new Map<string, T>();

  for (const field of sanitized) {
    const tier = fieldTier(field);
    const semantic = semanticFieldKey(field);

    if (tier === 'label') {
      const labelMatch = LABEL_STORAGE_PREFIX.exec(field.key);
      const tagId = field.tagId ?? labelMatch?.[1] ?? '';
      const slot = `${tagId}:${semantic}`;
      const prev = labelBySlot.get(slot);
      labelBySlot.set(slot, prev ? pickPreferredField(prev, field) : field);
      continue;
    }

    if (labelSemantics.has(semantic)) {
      continue;
    }

    const prev = sharedBySemantic.get(semantic);
    sharedBySemantic.set(semantic, prev ? pickPreferredField(prev, field) : field);
  }

  const sharedRows = [...sharedBySemantic.values()];
  const labelRows = [...labelBySlot.values()];
  const merged = [...sharedRows, ...labelRows];

  if (merged.length === sanitized.length) {
    const signature = (rows: T[]) =>
      rows.map((r) => `${r.key}\0${r.value}\0${r.confidence ?? ''}`).join('\n');
    if (signature(merged) === signature(sanitized)) {
      return sanitized;
    }
  }

  return merged;
}
