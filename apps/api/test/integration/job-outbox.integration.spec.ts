// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  type StartedValkey,
  startValkeyContainer,
} from '../../../../packages/testing/src/containers/index.js';
import { extractionJobId } from '../../src/modules/extraction/domain/extraction-queue.config.js';
import type { ExtractionOutboxEnqueuer } from '../../src/modules/job-outbox/infrastructure/outbox-relay.service.js';
import { OutboxRelayService } from '../../src/modules/job-outbox/infrastructure/outbox-relay.service.js';
import { PgJobOutboxRepository } from '../../src/modules/job-outbox/infrastructure/pg-job-outbox.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const QUEUE_NAME = 'document-extraction';

async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs: number,
  label: string
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

describe('job outbox + Valkey relay (Testcontainers)', () => {
  const pool = getIntegrationPool();
  let outbox: PgJobOutboxRepository;
  let userId: string;
  let valkey: StartedValkey;
  let connection: IORedis;
  const documentIds: string[] = [];

  beforeAll(async () => {
    process.env['JOB_OUTBOX_LEASE_MS'] = '500';
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Outbox IT',
        email: `${userId}@example.test`,
      });
      for (let i = 0; i < 5; i += 1) {
        const documentId = randomUUID();
        documentIds.push(documentId);
        await client.query(
          `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
           VALUES ($1, $2, $3, 'application/pdf', $4, 'uploaded')`,
          [documentId, userId, `outbox-${String(i)}.pdf`, `outbox/${documentId}`]
        );
      }
    } finally {
      client.release();
    }

    outbox = new PgJobOutboxRepository(pool);
    valkey = await startValkeyContainer();
    connection = new IORedis(valkey.url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }, 120_000);

  afterAll(async () => {
    await connection.quit();
    await valkey.stop();
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('schedules in one transaction and recovers exactly once after Valkey flush', async () => {
    for (const documentId of documentIds) {
      const result = await outbox.scheduleDocumentExtraction(documentId, userId, {
        maxAttempts: 5,
      });
      expect(result.created).toBe(true);
      const status = await pool.query<{ status: string }>(
        `SELECT status FROM documents WHERE id = $1`,
        [documentId]
      );
      expect(status.rows[0]?.status).toBe('queued');
    }

    const executions = new Map<string, number>();
    const queue = new Queue(QUEUE_NAME, { connection });
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const data: unknown = job.data;
        if (typeof data !== 'object' || data === null) {
          throw new Error('bad payload');
        }
        const outboxIdValue: unknown = Reflect.get(data, 'outboxId');
        const documentIdValue: unknown = Reflect.get(data, 'documentId');
        if (typeof outboxIdValue !== 'string' || typeof documentIdValue !== 'string') {
          throw new Error('bad payload fields');
        }
        const existing = await outbox.findById(outboxIdValue);
        if (existing?.status === 'done' || existing?.status === 'failed') {
          return;
        }
        const started = await outbox.markRunning(outboxIdValue);
        if (!started) {
          return;
        }
        executions.set(documentIdValue, (executions.get(documentIdValue) ?? 0) + 1);
        await new Promise((resolve) => setTimeout(resolve, 150));
        await outbox.markDone(outboxIdValue);
      },
      { connection, concurrency: 2 }
    );

    const enqueuer: ExtractionOutboxEnqueuer = {
      isReady: () => true,
      enqueueFromOutbox: async (payload) => {
        const jobId = extractionJobId(payload.documentId);
        const existing = await queue.getJob(jobId);
        if (existing) {
          const state = await existing.getState();
          if (
            state === 'waiting' ||
            state === 'delayed' ||
            state === 'active' ||
            state === 'prioritized' ||
            state === 'waiting-children'
          ) {
            return;
          }
          await existing.remove();
        }
        await queue.add('extract', payload, {
          jobId,
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 50,
        });
      },
    };
    const relay = new OutboxRelayService(outbox, enqueuer);

    const firstBatch = await relay.relayOnce();
    expect(firstBatch).toBe(documentIds.length);

    await waitFor(() => Promise.resolve(executions.size >= 1), 10_000, 'first execution');
    await connection.flushall();

    // Age lost queue rows only. Leave `running` alone so live workers finish
    // without a second reclaim (lease assumes worker death, not Valkey-only loss).
    await pool.query(
      `UPDATE job_outbox
       SET updated_at = now() - interval '10 seconds'
       WHERE document_id = ANY($1::uuid[])
         AND status IN ('pending', 'enqueued')`,
      [documentIds]
    );

    await waitFor(
      async () => {
        const again = await relay.relayOnce();
        return again >= 0;
      },
      5_000,
      'relay after flush'
    );

    await waitFor(
      async () => {
        await relay.relayOnce();
        const pending = await pool.query<{ count: string }>(
          `SELECT count(*)::text AS count FROM job_outbox
           WHERE document_id = ANY($1::uuid[]) AND status <> 'done'`,
          [documentIds]
        );
        return pending.rows[0]?.count === '0';
      },
      30_000,
      'all outbox rows done'
    );

    for (const documentId of documentIds) {
      expect(executions.get(documentId)).toBe(1);
    }

    await worker.close();
    await queue.close();
  }, 120_000);

  it('retries transient failures with backoff then marks failed', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'retry.pdf', 'application/pdf', $3, 'uploaded')`,
      [documentId, userId, `outbox/retry/${documentId}`]
    );
    const scheduled = await outbox.scheduleDocumentExtraction(documentId, userId, {
      maxAttempts: 2,
    });
    await outbox.markEnqueued(scheduled.outboxId);
    await outbox.markRunning(scheduled.outboxId);

    const afterFirst = await outbox.markFailedOrRetry(scheduled.outboxId, 'fetch failed', 1);
    expect(afterFirst).toBe('pending');

    await outbox.markEnqueued(scheduled.outboxId);
    await outbox.markRunning(scheduled.outboxId);
    const afterSecond = await outbox.markFailedOrRetry(scheduled.outboxId, 'fetch failed', 1);
    expect(afterSecond).toBe('failed');

    const doc = await pool.query<{ status: string; reason: string | null }>(
      `SELECT status, extraction_failure_reason AS reason FROM documents WHERE id = $1`,
      [documentId]
    );
    expect(doc.rows[0]?.status).toBe('failed');
    expect(doc.rows[0]?.reason).toBe('fetch failed');
  });
});
