// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import {
  LABEL_EMBEDDING_REPOSITORY,
  TAXONOMY_REPOSITORY,
  type LabelEmbeddingRepository,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { mergeCentroid } from '../domain/cosine.js';

@Injectable()
export class RecordEmbeddingFeedbackUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository
  ) {}

  async onAccept(documentId: string, userId: string, tagId: string): Promise<void> {
    await this.record(documentId, userId, tagId, 'accept');
  }

  async onReject(documentId: string, userId: string, tagId: string): Promise<void> {
    await this.record(documentId, userId, tagId, 'reject');
  }

  async onManualAssign(documentId: string, userId: string, tagId: string): Promise<void> {
    const tag = await this.taxonomy.findTagByIdForUser(tagId, userId);
    if (!tag || tag.isInbox) {
      return;
    }
    await this.boostCentroid(documentId, userId, tagId);
  }

  private async record(
    documentId: string,
    userId: string,
    tagId: string,
    action: 'accept' | 'reject'
  ): Promise<void> {
    await this.labelEmbeddings.recordFeedback(userId, documentId, tagId, action);
    if (action === 'accept') {
      await this.boostCentroid(documentId, userId, tagId);
    }
  }

  private async boostCentroid(documentId: string, userId: string, tagId: string): Promise<void> {
    const vector = await this.labelEmbeddings.getDocumentEmbedding(documentId);
    if (!vector) {
      return;
    }
    const centroids = await this.labelEmbeddings.getTagCentroids(userId);
    const existing = centroids.find((c) => c.tagId === tagId);
    const merged = mergeCentroid(existing?.centroid ?? null, existing?.sampleCount ?? 0, vector);
    await this.labelEmbeddings.saveTagCentroid(
      tagId,
      userId,
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      merged.sampleCount,
      merged.centroid
    );
  }
}
