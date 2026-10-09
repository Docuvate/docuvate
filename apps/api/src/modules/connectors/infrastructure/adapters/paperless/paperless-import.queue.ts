// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PaperlessImportExecutor } from './paperless-import.executor.js';
import { PaperlessImportRepository } from './paperless-import.repository.js';
import { ConnectorRuntimeResolver } from '../../../application/connector-runtime.resolver.js';

const QUEUE_NAME = 'connector-paperless-import';
const RESUME_BACKOFF_MS = [5_000, 15_000, 60_000, 120_000];

@Injectable()
export class PaperlessImportQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaperlessImportQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly imports: PaperlessImportRepository,
    private readonly executor: PaperlessImportExecutor,
    private readonly runtime: ConnectorRuntimeResolver
  ) {}

  onModuleInit(): void {
    const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';
    this.connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const runId = String(job.data.runId);
        const userId = String(job.data.userId);
        const claimed = await this.imports.claimRunForProcessing(runId);
        if (!claimed) {
          return;
        }
        const run = await this.imports.findRunForUser(runId, userId);
        if (!run) {
          return;
        }
        const resolved = await this.runtime.resolve(userId, run.installationId);
        if (resolved.pluginId !== 'paperless') {
          await this.imports.completeRun(
            runId,
            run.installationId,
            'failed',
            'connectors.errors.sourceNotSupported'
          );
          return;
        }
        try {
          await this.executor.runImportJob(run, resolved.credentials);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Paperless import run ${runId} failed: ${detail}`);
          await this.imports.completeRun(
            runId,
            run.installationId,
            'failed',
            'connectors.paperlessImport.runFailed'
          );
        }
      },
      { connection: this.connection, concurrency: 1 }
    );

    void this.resumeInterruptedRuns();
  }

  async resumeInterruptedRuns(): Promise<void> {
    let attempt = 0;
    while (attempt < RESUME_BACKOFF_MS.length) {
      try {
        const pending = await this.imports.resumePendingRuns();
        for (const run of pending) {
          await this.enqueue(run.id, run.userId);
        }
        return;
      } catch (err: unknown) {
        const detail = err instanceof Error ? err.message : String(err);
        const delay = RESUME_BACKOFF_MS[attempt] ?? 120_000;
        this.logger.warn(
          `Paperless import resume skipped (attempt ${attempt + 1}): ${detail}; retry in ${delay}ms`
        );
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    this.logger.error('Paperless import resume gave up after retries');
  }

  async enqueue(runId: string, userId: string): Promise<void> {
    await this.queue.add(
      'import',
      { runId, userId },
      { jobId: runId, removeOnComplete: 100, removeOnFail: 50 }
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}
