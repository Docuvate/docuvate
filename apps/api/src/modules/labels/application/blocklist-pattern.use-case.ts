// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import { ValidationError } from '../../../shared/domain/errors.js';
import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { compileBlocklistPattern } from '../domain/recommendation-blocklist.js';

@Injectable()
export class ConfirmBlocklistPatternUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  execute(userId: string, pattern: string) {
    const trimmed = pattern.trim();
    if (!compileBlocklistPattern(trimmed)) {
      throw new ValidationError('Ungültiges Regex-Muster');
    }
    if (trimmed.length > 200) {
      throw new ValidationError('Muster ist zu lang');
    }
    return this.labelEmbeddings.addRecommendationBlocklistPattern(userId, trimmed);
  }
}

@Injectable()
export class RemoveBlocklistPatternUseCase {
  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository
  ) {}

  execute(userId: string, patternId: string): Promise<void> {
    return this.labelEmbeddings.removeRecommendationBlocklistPattern(userId, patternId);
  }
}
