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
import { RecordEmbeddingDensityCorrectionUseCase } from './record-embedding-density-correction.use-case.js';

@Injectable()
export class RecordEmbeddingFeedbackUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    private readonly densityCorrection: RecordEmbeddingDensityCorrectionUseCase
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
    const previous = (await this.taxonomy.listTagsForDocument(documentId)).find((t) => !t.isInbox);
    const vector = await this.labelEmbeddings.getDocumentEmbedding(documentId);
    if (vector) {
      await this.densityCorrection.recordLabelCorrection({
        userId,
        documentId,
        vector,
        fromTagId: previous?.id ?? null,
        toTagId: tagId,
        createdBy: userId,
      });
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
