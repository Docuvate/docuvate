import { type Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { afterAll, describe, expect, it } from 'vitest';

import { startValkeyContainer } from '../../../../packages/testing/src/containers/index.js';
import { StartPaperlessImportUseCase } from '../../src/modules/connectors/application/paperless-import.use-cases.js';
import { PaperlessImportRepository } from '../../src/modules/connectors/infrastructure/adapters/paperless/paperless-import.repository.js';
import { PgConnectorInstallationRepository } from '../../src/modules/connectors/infrastructure/pg-connector-installation.repository.js';
import { ConflictError } from '../../src/shared/domain/errors.js';
import {
  createPaperlessConnectorRuntimeResolver,
  createPaperlessImportQueueService,
} from './paperless-import-fixtures.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

interface PaperlessImportJobPayload {
  runId: string;
  userId: string;
}

const QUEUE_NAME = 'connector-paperless-import-test';

describe('Paperless import concurrency (integration)', () => {
  const pool = getIntegrationPool();
  let valkeyStop: (() => Promise<void>) | null = null;
  let valkeyUrl: string;
  const userIds: string[] = [];

  afterAll(async () => {
    for (const id of userIds) {
      await deleteSyntheticUser(pool, id);
    }
    await closeIntegrationPool();
    if (valkeyStop) {
      await valkeyStop();
    }
  });

  async function createInstallation(): Promise<{ userId: string; installationId: string }> {
    if (!valkeyUrl) {
      const valkey = await startValkeyContainer();
      valkeyStop = valkey.stop;
      valkeyUrl = valkey.url;
    }
    const userId = newIsolationUserId();
    userIds.push(userId);
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Concurrency IT',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }
    const installations = new PgConnectorInstallationRepository(pool);
    const created = await installations.create({
      userId,
      pluginId: 'paperless',
      displayName: 'Concurrency',
      credentials: { base_url: 'http://127.0.0.1:18080', api_token: 'test' },
    });
    return { userId, installationId: created.id };
  }

  it('rejects a second start while a run is pending (409)', async () => {
    const { userId, installationId } = await createInstallation();
    const imports = new PaperlessImportRepository(pool);
    const runtime = createPaperlessConnectorRuntimeResolver(pool);
    const queue = createPaperlessImportQueueService(pool);
    const useCase = new StartPaperlessImportUseCase(runtime, imports, queue);

    await imports.createRun({
      installationId,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
    });

    await expect(useCase.execute(userId, installationId)).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows only one concurrent claim for the same run', async () => {
    const { installationId } = await createInstallation();
    const imports = new PaperlessImportRepository(pool);
    const run = await imports.createRun({
      installationId,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
    });
    const results = await Promise.all([
      imports.claimRunForProcessing(run.id),
      imports.claimRunForProcessing(run.id),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('deduplicates duplicate enqueue for the same run id', async () => {
    const { userId, installationId } = await createInstallation();
    const imports = new PaperlessImportRepository(pool);
    const run = await imports.createRun({
      installationId,
      ocrMode: 'keep_paperless',
      includeArchivedPdf: false,
    });
    const connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
    const queue = new Queue(QUEUE_NAME, { connection });
    let processed = 0;
    const worker = new Worker(
      QUEUE_NAME,
      async (job: Job<PaperlessImportJobPayload>) => {
        const claimed = await imports.claimRunForProcessing(job.data.runId);
        if (!claimed) {
          return;
        }
        processed += 1;
      },
      { connection, concurrency: 2 }
    );

    await queue.add('import', { runId: run.id, userId }, { jobId: run.id });
    await queue.add('import', { runId: run.id, userId }, { jobId: run.id });

    const deadline = Date.now() + 15_000;
    while (processed < 1 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(processed).toBe(1);

    await worker.close();
    await queue.close();
    await connection.quit();
  });
});
