// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListRecommendationBlocklistUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  async execute(userId: string) {
    const [items, patterns] = await Promise.all([
      this.labelEmbeddings.listRecommendationBlocklist(userId),
      this.labelEmbeddings.listRecommendationBlocklistPatterns(userId),
    ]);
    return {
      items: items.map((entry) => ({
        id: entry.id,
        phrase: entry.phrase,
        source: entry.source,
        createdAt: entry.createdAt.toISOString(),
      })),
      patterns: patterns.map((entry) => ({
        id: entry.id,
        pattern: entry.pattern,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }
}

@Injectable()
export class AddRecommendationBlocklistUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  execute(userId: string, phrase: string) {
    const trimmed = phrase.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Phrase must be at least 2 characters');
    }
    if (trimmed.length > 120) {
      throw new ValidationError('Phrase is too long');
    }
    return this.labelEmbeddings.addRecommendationBlocklist(userId, trimmed, 'manual');
  }
}

@Injectable()
export class RemoveRecommendationBlocklistUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  async execute(userId: string, entryId: string): Promise<void> {
    await this.labelEmbeddings.removeRecommendationBlocklist(userId, entryId);
  }
}
