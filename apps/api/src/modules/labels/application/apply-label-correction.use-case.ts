// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { ApplySparkLabelPropagationUseCase } from './apply-spark-label-propagation.use-case.js';
import { AssignDocumentTagUseCase } from './document-label.use-cases.js';
import { RecordEmbeddingDensityCorrectionUseCase } from './record-embedding-density-correction.use-case.js';

export interface ApplyLabelCorrectionResult {
  correctionId: string | null;
  similarDocumentsUpdated: number;
}

@Injectable()
export class ApplyLabelCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly assignTag: AssignDocumentTagUseCase,
    private readonly densityCorrection: RecordEmbeddingDensityCorrectionUseCase,
    private readonly sparkPropagation: ApplySparkLabelPropagationUseCase
  ) {}

  async execute(
    documentId: string,
    userId: string,
    toTagId: string
  ): Promise<ApplyLabelCorrectionResult> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const tag = await this.taxonomy.findTagByIdForUser(toTagId, userId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }
    const previous = (await this.taxonomy.listTagsForDocument(documentId)).find((t) => !t.isInbox);
    await this.assignTag.execute(documentId, userId, toTagId, { learnFromEmbedding: false });
    const correctionId = await this.densityCorrection.recordLabelCorrection({
      userId,
      documentId,
      fromTagId: previous?.id ?? null,
      toTagId,
      createdBy: userId,
    });
    const similarDocumentsUpdated = await this.sparkPropagation.propagateAfterLabelCorrection(
      userId,
      toTagId,
      documentId,
      correctionId
    );
    return { correctionId, similarDocumentsUpdated };
  }
}
