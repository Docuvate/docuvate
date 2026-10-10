// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { ApplyEmbeddingSuggestionsUseCase } from './apply-embedding-suggestions.use-case.js';

@Injectable()
export class RefreshEmbeddingSuggestionsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly applyEmbedding: ApplyEmbeddingSuggestionsUseCase
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const text = doc.extraction?.text ?? '';
    const content = `${doc.filename}\n${doc.title}\n${text}`;
    await this.applyEmbedding.execute(documentId, userId, content);
  }
}
