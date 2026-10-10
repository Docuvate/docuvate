// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DismissTagSuggestionRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { ApplyLabelCustomFieldsUseCase } from './apply-label-custom-fields.use-case.js';
import { RecordEmbeddingFeedbackUseCase } from './embedding-feedback.use-case.js';

@Injectable()
export class AssignDocumentTagUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly embeddingFeedback: RecordEmbeddingFeedbackUseCase,
    private readonly applyLabelCustomFields: ApplyLabelCustomFieldsUseCase
  ) {}

  async execute(
    documentId: string,
    userId: string,
    tagId: string,
    options?: { learnFromEmbedding?: boolean }
  ): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }
    await this.taxonomy.assignTagToDocument(documentId, tagId);
    await this.taxonomy.clearSuggestion(documentId, tagId);
    if (!tag.isInbox) {
      await this.taxonomy.clearInboxTagForDocument(documentId, userId);
    }
    if (options?.learnFromEmbedding !== false) {
      await this.embeddingFeedback.onManualAssign(documentId, userId, tagId);
    }
    await this.applyLabelCustomFields.execute(documentId, userId);
  }
}

@Injectable()
export class RemoveDocumentTagUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository
  ) {}

  async execute(documentId: string, userId: string, tagId: string): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.taxonomy.removeTagFromDocument(documentId, tagId);
  }
}

@Injectable()
export class AcceptTagSuggestionUseCase {
  constructor(
    private readonly assignTag: AssignDocumentTagUseCase,
    private readonly embeddingFeedback: RecordEmbeddingFeedbackUseCase
  ) {}

  async execute(documentId: string, userId: string, tagId: string): Promise<void> {
    await this.assignTag.execute(documentId, userId, tagId, { learnFromEmbedding: false });
    await this.embeddingFeedback.onAccept(documentId, userId, tagId);
  }
}

@Injectable()
export class DismissTagSuggestionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    private readonly embeddingFeedback: RecordEmbeddingFeedbackUseCase
  ) {}

  async execute(
    documentId: string,
    userId: string,
    tagId: string,
    options: DismissTagSuggestionRequest = {}
  ): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag) {
      throw new NotFoundError('Tag');
    }
    await this.taxonomy.dismissSuggestion(documentId, tagId);
    await this.embeddingFeedback.onReject(documentId, userId, tagId);
    if (options.blockFuture !== true) {
      return;
    }
    const phrase = tag.name.trim();
    if (phrase.length >= 2) {
      await this.labelEmbeddings.addRecommendationBlocklist(userId, phrase, 'dismiss');
    }
  }
}
