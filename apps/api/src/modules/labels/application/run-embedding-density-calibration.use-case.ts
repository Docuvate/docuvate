// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { HttpEmbeddingDensityAdapter } from '../infrastructure/http-embedding-density.adapter.js';
import { PgEmbeddingDensityRepository } from '../infrastructure/pg-embedding-density.repository.js';

const MIN_EXAMPLES_FOR_CALIBRATION = 600;

@Injectable()
export class RunEmbeddingDensityCalibrationUseCase {
  private readonly logger = new Logger(RunEmbeddingDensityCalibrationUseCase.name);

  constructor(
    private readonly densityRepo: PgEmbeddingDensityRepository,
    private readonly densityWorker: HttpEmbeddingDensityAdapter
  ) {}

  async execute(userId: string): Promise<boolean> {
    if (!embeddingDensityGloballyEnabled()) {
      return false;
    }
    const training = await this.densityRepo.listTrainingExamples(userId);
    if (training.vectors.length < MIN_EXAMPLES_FOR_CALIBRATION) {
      return false;
    }
    if (training.documentIds.length !== training.vectors.length) {
      this.logger.warn(
        `Embedding density calibration refused for ${userId}: document_ids missing on training rows`
      );
      return false;
    }
    const tagIds = training.allLabelIds;
    if (tagIds.length === 0) {
      return false;
    }

    try {
      let state = await this.densityRepo.loadWorkerState(userId, tagIds);
      if (!state) {
        const dim = training.vectors[0]?.length ?? 0;
        state = {
          label_ids: tagIds,
          dim,
          temperature: 1,
          class_bias: tagIds.map(() => 0),
          novelty_threshold: Number.NEGATIVE_INFINITY,
          coarse_ready: false,
          fine_ready: {},
          label_to_group: Object.fromEntries(tagIds.map((id) => [id, id])),
          log_priors: Object.fromEntries(
            tagIds.map((id) => [id, -Math.log(Math.max(tagIds.length, 1))])
          ),
          class_stats: {},
          coarse_thresholds: {},
          fine_thresholds: {},
          kernel: { bandwidth: 0.5, points: [], label_offsets: [] },
        };
      }

      const calibrated = await this.densityWorker.calibrate({
        state,
        vectors: training.vectors,
        exampleLabelIds: training.labelIds,
        documentIds: training.documentIds,
        delta: 0.05,
      });

      await this.densityRepo.persistCalibrationBundle(userId, calibrated.state, {
        nDocuments: new Set(training.documentIds).size,
        nExamples: training.vectors.length,
        delta: 0.05,
      });

      return (
        calibrated.state.coarse_ready ||
        Object.values(calibrated.state.fine_ready).some((ready) => ready)
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding density calibration failed for user ${userId}: ${message}`);
      return false;
    }
  }
}
