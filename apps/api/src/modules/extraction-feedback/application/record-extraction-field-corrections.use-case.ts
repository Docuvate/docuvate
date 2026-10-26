// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  EXTRACTION_FIELD_FEEDBACK_REPOSITORY,
  type ExtractionFieldFeedbackRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { diffExtractionFieldConfirmations } from '../domain/diff-extraction-field-confirmations.js';
import { diffExtractionFieldCorrections } from '../domain/diff-extraction-field-corrections.js';

export interface RecordExtractionFieldFeedbackResult {
  correctionsRecorded: number;
  confirmationsRecorded: number;
}

@Injectable()
export class RecordExtractionFieldCorrectionsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(EXTRACTION_FIELD_FEEDBACK_REPOSITORY)
    private readonly feedback: ExtractionFieldFeedbackRepository
  ) {}

  async execute(
    documentId: string,
    userId: string,
    previousFields: ExtractedField[],
    nextFields: ExtractedField[]
  ): Promise<RecordExtractionFieldFeedbackResult> {
    const correctionDrafts = diffExtractionFieldCorrections(previousFields, nextFields);
    const confirmationDrafts = diffExtractionFieldConfirmations(previousFields, nextFields);
    if (correctionDrafts.length === 0 && confirmationDrafts.length === 0) {
      return { correctionsRecorded: 0, confirmationsRecorded: 0 };
    }

    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const assignedTags = await this.taxonomy.listTagsForDocument(documentId);
    const labelTagIds = assignedTags.map((t) => t.id);

    const correctionsRecorded =
      correctionDrafts.length === 0
        ? 0
        : await this.feedback.insertCorrectionsIdempotent(
            userId,
            correctionDrafts.map((draft) => ({
              documentId,
              fieldKey: draft.fieldKey,
              oldValue: draft.oldValue,
              newValue: draft.newValue,
              labelTagIds,
              fieldTagId: draft.fieldTagId,
            }))
          );

    const confirmationsRecorded =
      confirmationDrafts.length === 0
        ? 0
        : await this.feedback.upsertConfirmations(
            userId,
            confirmationDrafts.map((draft) => ({
              documentId,
              fieldKey: draft.fieldKey,
              labelTagIds,
              fieldTagId: draft.fieldTagId,
            }))
          );

    return { correctionsRecorded, confirmationsRecorded };
  }
}
