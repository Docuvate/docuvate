// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  RecognizedFieldExtractionAttemptDto,
  RecognizedFieldExtractionOutcome,
} from '@docuvate/contracts';

export function buildRecognizedFieldAttemptIndex(
  attempts: readonly RecognizedFieldExtractionAttemptDto[] | undefined
): Map<string, RecognizedFieldExtractionAttemptDto> {
  const map = new Map<string, RecognizedFieldExtractionAttemptDto>();
  if (!attempts) {
    return map;
  }
  for (const attempt of attempts) {
    map.set(attempt.fieldDefinitionId, attempt);
    map.set(attempt.fieldKey, attempt);
  }
  return map;
}

export function attemptStatusTranslationKey(
  outcome: RecognizedFieldExtractionOutcome
): string {
  switch (outcome) {
    case 'not_applicable':
      return 'recognizedFields.attemptNotApplicable';
    case 'pending':
      return 'recognizedFields.attemptPending';
    case 'not_found':
      return 'recognizedFields.attemptNotFound';
    case 'below_threshold':
      return 'recognizedFields.attemptBelowThreshold';
    case 'found':
      return 'recognizedFields.attemptFound';
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}
