// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateRepository } from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../../documents/domain/document.entity.js';
import type { DuplicatePairEvaluationInput } from './duplicate-classifier.service.js';
import { compareInputFromDocument } from './duplicate-compare-input.js';

export async function buildPairEvaluationInput(
  duplicates: DuplicateRepository,
  primary: DocumentEntity,
  other: DocumentEntity,
  userId: string
): Promise<DuplicatePairEvaluationInput> {
  const forward = await duplicates.listForDocument(primary.id, userId);
  const reverse = await duplicates.listForDocument(other.id, userId);
  const link =
    forward.find((c) => c.candidateDocumentId === other.id) ??
    reverse.find((c) => c.candidateDocumentId === primary.id);

  return {
    left: compareInputFromDocument(primary),
    right: compareInputFromDocument(other),
    embeddingSimilarity: link?.similarity ?? 0,
    perceptualPageHashDistance: null,
  };
}
