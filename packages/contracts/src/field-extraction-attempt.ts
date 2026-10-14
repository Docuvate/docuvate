// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type RecognizedFieldExtractionOutcome =
  | 'not_applicable'
  | 'pending'
  | 'not_found'
  | 'below_threshold'
  | 'found';

export interface RecognizedFieldExtractionAttemptDto {
  fieldDefinitionId: string;
  fieldKey: string;
  outcome: RecognizedFieldExtractionOutcome;
  confidence: number | null;
  updatedAt: string;
}

export const RECOGNIZED_FIELD_EXTRACTION_OUTCOMES: readonly RecognizedFieldExtractionOutcome[] = [
  'not_applicable',
  'pending',
  'not_found',
  'below_threshold',
  'found',
];
