// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  LABEL_EMBEDDING_REPOSITORY,
  type LabelEmbeddingRepository,
} from '../../../shared/domain/ports.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { EmbeddingDensityCalibrationQueueService } from '../infrastructure/embedding-density-calibration-queue.service.js';
import { HttpEmbeddingDensityAdapter } from '../infrastructure/http-embedding-density.adapter.js';
import { PgEmbeddingDensityRepository } from '../infrastructure/pg-embedding-density.repository.js';

@Injectable()
export class RecordEmbeddingDensityCorrectionUseCase {
  private readonly logger = new Logger(RecordEmbeddingDensityCorrectionUseCase.name);

  constructor(
    @Inject(LABEL_EMBEDDING_REPOSITORY) private readonly labelEmbeddings: LabelEmbeddingRepository,
    private readonly densityRepo: PgEmbeddingDensityRepository,
    private readonly densityWorker: HttpEmbeddingDensityAdapter,
    private readonly calibrationQueue: EmbeddingDensityCalibrationQueueService
  ) {}

  async recordLabelCorrection(params: {
    userId: string;
    documentId: string;
    vector?: number[] | null;
    fromTagId: string | null;
    toTagId: string;
    createdBy: string;
  }): Promise<string | null> {
    if (!embeddingDensityGloballyEnabled()) {
      return null;
    }
    try {
      const vector =
        params.vector ?? (await this.labelEmbeddings.getDocumentEmbedding(params.documentId));
      if (!vector || vector.length === 0) {
        return null;
      }
      const tagIds = (await this.densityRepo.listTrainingExamples(params.userId)).allLabelIds;
      if (tagIds.length === 0) {
        return null;
      }
      const state = await this.densityRepo.loadWorkerState(params.userId, tagIds);
      if (!state) {
        return null;
      }
      const updated = await this.densityWorker.correct(state, vector, params.toTagId);
      const correctionId = await this.densityRepo.persistCorrection(
        params.userId,
        params.documentId,
        params.fromTagId,
        params.toTagId,
        params.createdBy,
        updated,
        tagIds
      );
      void this.calibrationQueue.scheduleUserCalibration(params.userId);
      return correctionId;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Embedding density correction skipped for document ${params.documentId}: ${message}`
      );
      return null;
    }
  }
}