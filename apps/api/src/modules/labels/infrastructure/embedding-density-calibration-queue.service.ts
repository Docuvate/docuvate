// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { RunEmbeddingDensityCalibrationUseCase } from '../application/run-embedding-density-calibration.use-case.js';
import {
  EMBEDDING_DENSITY_CALIBRATION_DEBOUNCE_MS,
  EMBEDDING_DENSITY_RECALIBRATION_MIN_NEW_EXAMPLES,
  EMBEDDING_DENSITY_RECALIBRATION_SCAN_MS,
} from '../domain/embedding-density-calibration-config.js';
import { embeddingDensityGloballyEnabled } from '../domain/embedding-density-flag.js';
import { PgEmbeddingDensityRepository } from './pg-embedding-density.repository.js';

const QUEUE_NAME = 'embedding-density-calibration';

interface EmbeddingDensityCalibrationJobData {
  userId: string;
}

@Injectable()
export class EmbeddingDensityCalibrationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingDensityCalibrationQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<EmbeddingDensityCalibrationJobData> | null = null;
  private worker: Worker<EmbeddingDensityCalibrationJobData> | null = null;
  private scanTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly calibrate: RunEmbeddingDensityCalibrationUseCase,
    private readonly densityRepo: PgEmbeddingDensityRepository
  ) {}

  onModuleInit(): void {
    if (!embeddingDensityGloballyEnabled()) {
      return;
    }
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<EmbeddingDensityCalibrationJobData>(QUEUE_NAME, {
      connection: this.connection,
    });
    this.worker = new Worker<EmbeddingDensityCalibrationJobData>(
      QUEUE_NAME,
      async (job) => {
        await this.calibrate.execute(job.data.userId);
      },
      { connection: this.connection, concurrency: 1 }
    );

    this.scanTimer = setInterval(() => {
      void this.scanForStaleCalibrations();
    }, EMBEDDING_DENSITY_RECALIBRATION_SCAN_MS);
  }

  async scheduleUserCalibration(userId: string): Promise<void> {
    if (!this.queue) {
      return;
    }
    const jobId = `embedding-density-calibrate-${userId}`;
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      await existing.remove();
    }
    await this.queue.add(
      'calibrate',
      { userId },
      {
        jobId,
        delay: EMBEDDING_DENSITY_CALIBRATION_DEBOUNCE_MS,
        removeOnComplete: 100,
        removeOnFail: 50,
      }
    );
  }

  private async scanForStaleCalibrations(): Promise<void> {
    if (!this.queue) {
      return;
    }
    try {
      const userIds = await this.densityRepo.listUsersWithCalibrationReady();
      for (const userId of userIds) {
        const training = await this.densityRepo.listTrainingExamples(userId);
        const baseline = await this.densityRepo.activeCalibrationExampleCount(userId);
        if (baseline === null) {
          continue;
        }
        if (
          training.vectors.length >=
          baseline + EMBEDDING_DENSITY_RECALIBRATION_MIN_NEW_EXAMPLES
        ) {
          await this.scheduleUserCalibration(userId);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Embedding density recalibration scan skipped: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
    }
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
    if (this.connection) {
      await this.connection.quit();
    }
  }
}
