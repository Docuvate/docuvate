// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DuplicateCandidateDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  DUPLICATE_REPOSITORY,
  DUPLICATE_STACK_REPOSITORY,
  type DuplicateRepository,
  type DuplicateStackRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListDuplicateCandidatesUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository
  ) {}

  async execute(documentId: string, userId: string): Promise<DuplicateCandidateDto[]> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) throw new NotFoundError('Document');
    const rows = await this.duplicates.listForDocument(documentId, userId);
    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      candidateDocumentId: row.candidateDocumentId,
      candidateTitle: row.candidateTitle,
      candidateFilename: row.candidateFilename,
      similarity: row.similarity,
      source: row.source,
      dismissed: row.dismissed,
    }));
  }
}

@Injectable()
export class DismissDuplicateCandidateUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DUPLICATE_REPOSITORY) private readonly duplicates: DuplicateRepository,
    @Inject(DUPLICATE_STACK_REPOSITORY) private readonly stacks: DuplicateStackRepository
  ) {}

  async execute(documentId: string, candidateDocumentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) throw new NotFoundError('Document');
    await this.duplicates.dismiss(documentId, candidateDocumentId, userId);
    await this.stacks.removeMember(userId, candidateDocumentId);
  }
}
