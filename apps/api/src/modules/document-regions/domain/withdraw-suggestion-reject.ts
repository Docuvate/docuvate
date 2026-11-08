// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { normalizeSuggestionDecisionValue, suggestionRejectIdentityKeys } from '@docuvate/contracts';

import type {
  DocumentRegionRepository,
  FieldSuggestionRejectRecord,
} from '../../../shared/domain/ports.js';

type SuggestionRejectStore = Pick<
  DocumentRegionRepository,
  'findActiveFieldSuggestionReject' | 'withdrawFieldCorrection'
>;

/**
 * Accepting or correcting a value withdraws an active reject of that same
 * review row. Withdraw marks the correction; it does not delete OCR text,
 * regions, or other field values.
 */
export async function withdrawSuggestionRejectsForValue(
  regions: SuggestionRejectStore,
  documentId: string,
  fieldKey: string,
  value: string
): Promise<FieldSuggestionRejectRecord[]> {
  const normalized = normalizeSuggestionDecisionValue(value);
  if (!normalized) {
    return [];
  }
  const withdrawn: FieldSuggestionRejectRecord[] = [];
  for (const key of suggestionRejectIdentityKeys(fieldKey)) {
    const existing = await regions.findActiveFieldSuggestionReject(
      documentId,
      key,
      normalized
    );
    if (!existing) {
      continue;
    }
    const didWithdraw = await regions.withdrawFieldCorrection(documentId, existing.correctionId);
    if (didWithdraw) {
      withdrawn.push(existing);
    }
  }
  return withdrawn;
}

export async function findActiveSuggestionReject(
  regions: Pick<DocumentRegionRepository, 'findActiveFieldSuggestionReject'>,
  documentId: string,
  fieldKey: string,
  valueNormalized: string
): Promise<FieldSuggestionRejectRecord | null> {
  for (const key of suggestionRejectIdentityKeys(fieldKey)) {
    const existing = await regions.findActiveFieldSuggestionReject(
      documentId,
      key,
      valueNormalized
    );
    if (existing) {
      return existing;
    }
  }
  return null;
}
