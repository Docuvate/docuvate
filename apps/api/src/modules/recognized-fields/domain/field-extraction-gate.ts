// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type FieldExtractionLabelMatch = 'any' | 'all';

export interface FieldExtractionGateConfig {
  /** When false, label-confidence is not required (required-label gate may still apply). */
  confidenceGateEnabled: boolean;
  minLabelConfidence: number;
  /** Tag ids that must be present (see `requiredLabelMatch`). Empty = no label requirement. */
  requiredLabelIds: string[];
  /** When `all`, every id must be assigned; when `any`, at least one. */
  requiredLabelMatch: FieldExtractionLabelMatch;
}

export interface FieldExtractionGateDocumentLabels {
  assignedTagIds: string[];
  assignedNonInboxTagIds: string[];
  suggestions: Array<{ tagId: string; confidence: number; isInbox: boolean }>;
}

/**
 * Returns true when gated recognized-field extraction may run for this document.
 * Ungated catalog fields (`extractForAllDocuments`) ignore this gate.
 */
export function evaluateFieldExtractionGate(
  labels: FieldExtractionGateDocumentLabels,
  config: FieldExtractionGateConfig
): boolean {
  const assigned = new Set(labels.assignedTagIds);

  if (config.requiredLabelIds.length > 0) {
    const match = config.requiredLabelMatch ?? 'all';
    if (match === 'all') {
      for (const tagId of config.requiredLabelIds) {
        if (!assigned.has(tagId)) {
          return false;
        }
      }
    } else {
      const hasAny = config.requiredLabelIds.some((tagId) => assigned.has(tagId));
      if (!hasAny) {
        return false;
      }
    }
  }

  if (!config.confidenceGateEnabled) {
    return config.requiredLabelIds.length > 0;
  }

  if (labels.assignedNonInboxTagIds.length > 0) {
    return true;
  }

  const threshold = config.minLabelConfidence;
  for (const suggestion of labels.suggestions) {
    if (suggestion.isInbox) {
      continue;
    }
    if ((suggestion.confidence ?? 0) >= threshold) {
      return true;
    }
  }

  return false;
}
