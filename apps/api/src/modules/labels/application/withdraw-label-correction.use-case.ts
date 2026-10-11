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
import { PgEmbeddingDensityRepository } from '../infrastructure/pg-embedding-density.repository.js';

@Injectable()
export class WithdrawLabelCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly densityRepo: PgEmbeddingDensityRepository
  ) {}

  async execute(documentId: string, userId: string, correctionId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const assignment = await this.densityRepo.findLabelCorrectionAssignment(
      userId,
      documentId,
      correctionId
    );
    if (!assignment) {
      throw new NotFoundError('Correction');
    }
    const propagated = await this.densityRepo.listPropagatedAssignments(correctionId);
    const withdrawn = await this.densityRepo.withdrawLabelCorrection(userId, correctionId);
    if (!withdrawn) {
      return;
    }
    for (const row of propagated) {
      await this.taxonomy.removeTagFromDocument(row.documentId, row.tagId);
      if (row.inboxCleared) {
        const inbox = await this.taxonomy.ensureInboxTag(userId);
        await this.taxonomy.assignTagToDocument(row.documentId, inbox.id);
      }
    }
    const assigned = await this.taxonomy.listTagsForDocument(documentId);
    if (assigned.some((tag) => tag.id === assignment.toTagId)) {
      await this.taxonomy.removeTagFromDocument(documentId, assignment.toTagId);
    }
    if (assignment.fromTagId && !assigned.some((tag) => tag.id === assignment.fromTagId)) {
      await this.taxonomy.assignTagToDocument(documentId, assignment.fromTagId);
    }
  }
}
