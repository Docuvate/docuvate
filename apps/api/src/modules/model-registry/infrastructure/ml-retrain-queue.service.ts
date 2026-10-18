// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';

import {
  isRecord,
  parseString,
} from '../../../shared/infrastructure/database/row-parse.js';
import {
  CORRECTION_DRIVEN_FAMILY_IDS,
  mlopsEnabled,
  mlopsRetrainCorrectionThreshold,
  mlopsRetrainCronIntervalMs,
} from '../../../shared/infrastructure/mlops/mlops-config.js';
import {
  createValkeyConnection,
  waitForValkeyReady,
} from '../../../shared/infrastructure/valkey/valkey-connection.js';

function parseRetrainJobData(data: unknown): { jobId: string; familyId: string } | null {
  if (!isRecord(data)) {
    return null;
  }
  const jobId = parseString(data.jobId);
  const familyId = parseString(data.familyId);
  if (!jobId || !familyId) {
    return null;
  }
  return { jobId, familyId };
}
import { EvaluateMlRetrainThresholdsUseCase } from '../application/model-registry.use-cases.js';
import {
  MODEL_REGISTRY_REPOSITORY,
  type ModelRegistryRepository,
} from '../domain/model-registry.repository.port.js';
import { HttpMlRetrainAdapter } from './http-ml-retrain.adapter.js';

const QUEUE_NAME = 'ml-retrain';

@Injectable()
export class MlRetrainQueueService implements OnModuleInit, OnModuleDestroy {
  private connection: IORedis | null = null;
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private cronTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(MODEL_REGISTRY_REPOSITORY) private readonly registry: ModelRegistryRepository,
    private readonly evaluateThresholds: EvaluateMlRetrainThresholdsUseCase,
    private readonly workerClient: HttpMlRetrainAdapter
  ) {}

  async onModuleInit(): Promise<void> {
    if (!mlopsEnabled()) {
      return;
    }
    this.connection = createValkeyConnection();
    await waitForValkeyReady(this.connection);
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const payload = parseRetrainJobData(job.data);
        if (!payload) {
          throw new Error('Invalid ML retrain job payload');
        }
        const { jobId, familyId } = payload;
        await this.registry.updateRetrainJob(jobId, {
          status: 'running',
          startedAt: new Date(),
        });
        try {
          const watermark = await this.registry.lastSnapshotWatermarkForFamily(familyId);
          const correctionCount = await this.registry.countCorrectionsSince(watermark);
          const result = await this.workerClient.runRetrainStub({
            jobId,
            familyId,
            correctionCount,
          });
          const snapshot = await this.registry.insertTrainingSnapshot({
            familyId,
            datasetVersion: result.datasetVersion,
            sourceWatermark: new Date(),
            rowCount: result.rowCount,
            storageUri: null,
            metadata: { stub: true, correctionCount },
          });
          const version = await this.registry.registerModelVersion({
            familyId,
            versionTag: result.versionTag,
            artifactUri: result.artifactUri,
            externalRunId: result.externalRunId,
            metrics: result.metrics,
            trainingSnapshotId: snapshot.id,
            notes: result.notes,
          });
          await this.registry.updateRetrainJob(jobId, {
            status: 'succeeded',
            trainingSnapshotId: snapshot.id,
            resultVersionId: version.id,
            finishedAt: new Date(),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await this.registry.updateRetrainJob(jobId, {
            status: 'failed',
            errorMessage: message,
            finishedAt: new Date(),
          });
          throw err;
        }
      },
      { connection: this.connection }
    );

    const intervalMs = mlopsRetrainCronIntervalMs();
    this.cronTimer = setInterval(() => {
      void this.scanThresholds();
    }, intervalMs);
    void this.scanThresholds();
  }

  async enqueueJob(jobId: string, familyId: string): Promise<void> {
    const queue = this.queue;
    if (!queue) {
      return;
    }
    await queue.add(
      'retrain',
      { jobId, familyId },
      { removeOnComplete: 100, removeOnFail: 50 }
    );
  }

  private async scanThresholds(): Promise<void> {
    if (!mlopsEnabled() || this.queue === null) {
      return;
    }
    const threshold = mlopsRetrainCorrectionThreshold();
    const jobs = await this.evaluateThresholds.execute(CORRECTION_DRIVEN_FAMILY_IDS, threshold);
    for (const job of jobs) {
      await this.enqueueJob(job.id, job.familyId);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.cronTimer) {
      clearInterval(this.cronTimer);
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
