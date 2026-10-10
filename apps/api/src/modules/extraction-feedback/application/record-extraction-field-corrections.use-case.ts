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
import { diffExtractionFieldCorrections } from '../domain/diff-extraction-field-corrections.js';

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
  ): Promise<number> {
    const drafts = diffExtractionFieldCorrections(previousFields, nextFields);
    if (drafts.length === 0) {
      return 0;
    }

    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }

    const assignedTags = await this.taxonomy.listTagsForDocument(documentId);
    const labelTagIds = assignedTags.map((t) => t.id);

    return this.feedback.insertMany(
      userId,
      drafts.map((draft) => ({
        documentId,
        fieldKey: draft.fieldKey,
        oldValue: draft.oldValue,
        newValue: draft.newValue,
        labelTagIds,
        fieldTagId: draft.fieldTagId,
      }))
    );
  }
}
