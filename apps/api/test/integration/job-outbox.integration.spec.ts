// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { type Queue as ExtractionQueue, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  type StartedValkey,
  startValkeyContainer,
} from '../../../../packages/testing/src/containers/index.js';
import { extractionJobId } from '../../src/modules/extraction/domain/extraction-queue.config.js';
import { OUTBOX_ATTEMPTS_EXHAUSTED_REASON } from '../../src/modules/job-outbox/domain/job-outbox.types.js';
import type { ExtractionOutboxEnqueuer } from '../../src/modules/job-outbox/infrastructure/outbox-relay.service.js';
import { OutboxRelayService } from '../../src/modules/job-outbox/infrastructure/outbox-relay.service.js';
import { PgJobOutboxRepository } from '../../src/modules/job-outbox/infrastructure/pg-job-outbox.repository.js';
import { ForbiddenError } from '../../src/shared/domain/errors.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

const QUEUE_NAME = 'document-extraction';
const MISSING_KEY_COMMAND = 'moveToFinished';

function readExtractPayload(data: unknown): { outboxId: string; documentId: string } {
  if (typeof data !== 'object' || data === null) {
    throw new Error('bad payload');
  }
  const outboxId: unknown = Reflect.get(data, 'outboxId');
  const documentId: unknown = Reflect.get(data, 'documentId');
  if (typeof outboxId !== 'string' || typeof documentId !== 'string') {
    throw new Error('bad payload fields');
  }
  return { outboxId, documentId };
}

function directEnqueuer(queue: ExtractionQueue): ExtractionOutboxEnqueuer {
  return {
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
}

function recordWorkerLoss(worker: Worker, losses: string[]): void {
  worker.on('error', (error: Error) => {
    losses.push(error.message);
  });
  worker.on('failed', (_job, error: Error) => {
    losses.push(error.message);
  });
}

async function outboxRow(
  pool: pg.Pool,
  documentId: string,
  ownerId: string
): Promise<{ status: string; attempts: number } | null> {
  const result = await pool.query<{ status: string; attempts: number }>(
    `SELECT status, attempts
     FROM job_outbox
     WHERE document_id = $1 AND user_id = $2`,
    [documentId, ownerId]
  );
  expect(result.rows.length).toBeLessThanOrEqual(1);
  return result.rows[0] ?? null;
}

interface JsonRow {
  status: string;
  user_id: string;
  [key: string]: unknown;
}

async function jsonDocument(pool: pg.Pool, documentId: string): Promise<JsonRow | null> {
  const result = await pool.query<{ row: JsonRow | null }>(
    `SELECT to_jsonb(d) AS row FROM documents d WHERE id = $1`,
    [documentId]
  );
  return result.rows[0]?.row ?? null;
}

async function jsonOutbox(pool: pg.Pool, documentId: string): Promise<JsonRow[]> {
  const result = await pool.query<{ row: JsonRow }>(
    `SELECT to_jsonb(j) AS row
     FROM job_outbox j
     WHERE j.document_id = $1
     ORDER BY j.created_at`,
    [documentId]
  );
  return result.rows.map((entry) => entry.row);
}

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

  it('rebuilds enqueued rows after Valkey FLUSHALL and completes each document once', async () => {
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

    const queue = new Queue(QUEUE_NAME, { connection });
    const relay = new OutboxRelayService(outbox, directEnqueuer(queue));
    await waitFor(
      async () => {
        await relay.relayOnce();
        let enqueued = 0;
        for (const documentId of documentIds) {
          const row = await outboxRow(pool, documentId, userId);
          if (row?.status === 'enqueued' && row.attempts === 0) {
            enqueued += 1;
          }
        }
        return enqueued === documentIds.length;
      },
      10_000,
      'initial enqueue'
    );
    for (const documentId of documentIds) {
      const job = await queue.getJob(extractionJobId(documentId));
      expect(job).toBeDefined();
      const row = await outboxRow(pool, documentId, userId);
      expect(row?.status).toBe('enqueued');
      expect(row?.attempts).toBe(0);
    }

    await connection.flushall();
    for (const documentId of documentIds) {
      expect(await queue.getJob(extractionJobId(documentId))).toBeUndefined();
    }

    await pool.query(
      `UPDATE job_outbox
       SET updated_at = now() - interval '10 seconds'
       WHERE document_id = ANY($1::uuid[])
         AND status = 'enqueued'`,
      [documentIds]
    );

    const executions = new Map<string, number>();
    const losses: string[] = [];
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const payload = readExtractPayload(job.data);
        const existing = await outbox.findById(payload.outboxId);
        if (existing?.status === 'done' || existing?.status === 'failed') {
          return;
        }
        const started = await outbox.markRunning(payload.outboxId);
        if (!started) {
          return;
        }
        executions.set(payload.documentId, (executions.get(payload.documentId) ?? 0) + 1);
        await outbox.markDone(payload.outboxId);
      },
      { connection, concurrency: 2 }
    );
    recordWorkerLoss(worker, losses);

    try {
      // markEnqueued returns false once the worker has already stored `done`.
      // The relay count is not the exactly-once proof; the outbox rows are.
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
        'rebuilt outbox rows done'
      );

      for (const documentId of documentIds) {
        expect(executions.get(documentId)).toBe(1);
        const row = await outboxRow(pool, documentId, userId);
        expect(row?.status).toBe('done');
        expect(row?.attempts).toBe(1);
        const doc = await pool.query<{ status: string }>(
          `SELECT status FROM documents WHERE id = $1 AND user_id = $2`,
          [documentId, userId]
        );
        expect(doc.rows[0]?.status).toBe('queued');
      }
      expect(losses).toEqual([]);

      await relay.relayOnce();
      for (const documentId of documentIds) {
        expect(executions.get(documentId)).toBe(1);
        const row = await outboxRow(pool, documentId, userId);
        expect(row?.status).toBe('done');
        expect(row?.attempts).toBe(1);
      }
    } finally {
      await worker.close();
      await queue.close();
    }
  }, 120_000);

  it('finishes one in-flight attempt when FLUSHALL deletes the BullMQ job key', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'inflight.pdf', 'application/pdf', $3, 'uploaded')`,
      [documentId, userId, `outbox/inflight/${documentId}`]
    );
    const scheduled = await outbox.scheduleDocumentExtraction(documentId, userId, {
      maxAttempts: 5,
    });
    await connection.flushall();
    let releaseHold = (): void => undefined;
    const hold = new Promise<void>((resolve) => {
      releaseHold = resolve;
    });
    const executions = new Map<string, number>();
    const losses: string[] = [];
    const queue = new Queue(QUEUE_NAME, { connection });
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const payload = readExtractPayload(job.data);
        if (payload.documentId !== documentId) {
          return;
        }
        const started = await outbox.markRunning(payload.outboxId);
        if (!started) {
          return;
        }
        executions.set(payload.documentId, (executions.get(payload.documentId) ?? 0) + 1);
        await hold;
        await outbox.markDone(payload.outboxId);
      },
      { connection, concurrency: 1 }
    );
    recordWorkerLoss(worker, losses);
    const relay = new OutboxRelayService(outbox, directEnqueuer(queue));

    try {
      await waitFor(
        async () => {
          await relay.relayOnce();
          return executions.get(documentId) === 1;
        },
        10_000,
        'in-flight attempt started'
      );
      const running = await outbox.findById(scheduled.outboxId);
      expect(running?.status).toBe('running');
      expect(running?.attempts).toBe(1);

      await connection.flushall();
      expect(await queue.getJob(extractionJobId(documentId))).toBeUndefined();
      releaseHold();

      await waitFor(
        async () => {
          const row = await outbox.findById(scheduled.outboxId);
          return row?.status === 'done';
        },
        10_000,
        'in-flight outbox done'
      );
      await waitFor(
        () => Promise.resolve(losses.length > 0),
        10_000,
        'BullMQ missing-key acknowledgement'
      );

      expect(executions.get(documentId)).toBe(1);
      const done = await outbox.findById(scheduled.outboxId);
      expect(done?.status).toBe('done');
      expect(done?.attempts).toBe(1);
      const expectedLoss = `Missing key for job ${extractionJobId(documentId)}. ${MISSING_KEY_COMMAND}`;
      expect(losses.length).toBeGreaterThan(0);
      for (const message of losses) {
        expect(message).toBe(expectedLoss);
      }
      const doc = await pool.query<{ status: string; reason: string | null }>(
        `SELECT status, extraction_failure_reason AS reason FROM documents WHERE id = $1 AND user_id = $2`,
        [documentId, userId]
      );
      expect(doc.rows[0]?.status).toBe('queued');
      expect(doc.rows[0]?.reason).toBeNull();

      await relay.relayOnce();
      expect(executions.get(documentId)).toBe(1);
      const after = await outbox.findById(scheduled.outboxId);
      expect(after?.status).toBe('done');
      expect(after?.attempts).toBe(1);
    } finally {
      releaseHold();
      await worker.close();
      await queue.close();
    }
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

  it('leaves the owner document and outbox unchanged when another user schedules', async () => {
    const ownerId = newIsolationUserId();
    const documentId = randomUUID();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: ownerId,
        name: 'Other tenant',
        email: `${ownerId}@example.test`,
      });
      await client.query(
        `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
         VALUES ($1, $2, 'other.pdf', 'application/pdf', $3, 'uploaded')`,
        [documentId, ownerId, `outbox/other/${documentId}`]
      );
    } finally {
      client.release();
    }

    try {
      await expect(outbox.scheduleDocumentExtraction(documentId, userId)).rejects.toBeInstanceOf(
        ForbiddenError
      );
      const untouched = await jsonDocument(pool, documentId);
      expect(untouched?.status).toBe('uploaded');
      expect(untouched?.user_id).toBe(ownerId);
      expect(await jsonOutbox(pool, documentId)).toEqual([]);

      const scheduled = await outbox.scheduleDocumentExtraction(documentId, ownerId);
      await outbox.markEnqueued(scheduled.outboxId);
      await outbox.markRunning(scheduled.outboxId);
      await pool.query(
        `UPDATE documents SET status = 'extracting' WHERE id = $1 AND user_id = $2`,
        [documentId, ownerId]
      );
      const documentBefore = await jsonDocument(pool, documentId);
      const outboxBefore = await jsonOutbox(pool, documentId);
      expect(outboxBefore).toHaveLength(1);
      expect(documentBefore?.status).toBe('extracting');
      expect(documentBefore?.user_id).toBe(ownerId);

      await expect(outbox.scheduleDocumentExtraction(documentId, userId)).rejects.toBeInstanceOf(
        ForbiddenError
      );

      expect(await jsonDocument(pool, documentId)).toEqual(documentBefore);
      expect(await jsonOutbox(pool, documentId)).toEqual(outboxBefore);
    } finally {
      await deleteSyntheticUser(pool, ownerId);
    }
  });

  it('does not move an in-flight extraction back to queued', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'live.pdf', 'application/pdf', $3, 'uploaded')`,
      [documentId, userId, `outbox/live/${documentId}`]
    );
    const scheduled = await outbox.scheduleDocumentExtraction(documentId, userId);
    await outbox.markEnqueued(scheduled.outboxId);
    await outbox.markRunning(scheduled.outboxId);
    await pool.query(`UPDATE documents SET status = 'extracting' WHERE id = $1 AND user_id = $2`, [
      documentId,
      userId,
    ]);

    await outbox.scheduleDocumentExtraction(documentId, userId);

    const status = await pool.query<{ status: string }>(
      `SELECT status FROM documents WHERE id = $1`,
      [documentId]
    );
    expect(status.rows[0]?.status).toBe('extracting');
    const row = await outbox.findById(scheduled.outboxId);
    expect(row?.status).toBe('running');
  });

  it('fails a leased running job that already used its attempts instead of enqueueing it', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'capped.pdf', 'application/pdf', $3, 'uploaded')`,
      [documentId, userId, `outbox/capped/${documentId}`]
    );
    const scheduled = await outbox.scheduleDocumentExtraction(documentId, userId, {
      maxAttempts: 1,
    });
    await outbox.markEnqueued(scheduled.outboxId);
    await outbox.markRunning(scheduled.outboxId);
    await pool.query(
      `UPDATE job_outbox SET updated_at = now() - interval '10 seconds' WHERE id = $1`,
      [scheduled.outboxId]
    );
    const previous = process.env['JOB_OUTBOX_RUNNING_LEASE_MS'];
    process.env['JOB_OUTBOX_RUNNING_LEASE_MS'] = '1000';
    let enqueued = false;
    const relay = new OutboxRelayService(outbox, {
      isReady: () => true,
      enqueueFromOutbox: () => {
        enqueued = true;
        return Promise.resolve();
      },
    });
    try {
      const count = await relay.relayOnce();
      expect(count).toBe(0);
      expect(enqueued).toBe(false);
    } finally {
      if (previous === undefined) {
        delete process.env['JOB_OUTBOX_RUNNING_LEASE_MS'];
      } else {
        process.env['JOB_OUTBOX_RUNNING_LEASE_MS'] = previous;
      }
    }
    const row = await outbox.findById(scheduled.outboxId);
    expect(row?.status).toBe('failed');
    const doc = await pool.query<{ status: string; reason: string | null }>(
      `SELECT status, extraction_failure_reason AS reason FROM documents WHERE id = $1`,
      [documentId]
    );
    expect(doc.rows[0]?.status).toBe('failed');
    expect(doc.rows[0]?.reason).toBe(OUTBOX_ATTEMPTS_EXHAUSTED_REASON);
  });

  it('fails a non-retryable attempt without consuming the remaining cap', async () => {
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'permanent.pdf', 'application/pdf', $3, 'uploaded')`,
      [documentId, userId, `outbox/permanent/${documentId}`]
    );
    const scheduled = await outbox.scheduleDocumentExtraction(documentId, userId, {
      maxAttempts: 5,
    });
    await outbox.markEnqueued(scheduled.outboxId);
    await outbox.markRunning(scheduled.outboxId);
    const status = await outbox.markFailedOrRetry(
      scheduled.outboxId,
      'document_unprocessable: bad pdf',
      2_000,
      { allowRetry: false }
    );
    expect(status).toBe('failed');
    const doc = await pool.query<{ status: string; reason: string | null }>(
      `SELECT status, extraction_failure_reason AS reason FROM documents WHERE id = $1`,
      [documentId]
    );
    expect(doc.rows[0]?.status).toBe('failed');
    expect(doc.rows[0]?.reason).toBe('document_unprocessable: bad pdf');
    const row = await outbox.findById(scheduled.outboxId);
    expect(row?.attempts).toBe(1);
  });
});
