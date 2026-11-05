import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import type { JobOutboxRepository } from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  JOB_TYPE_DOCUMENT_EXTRACTION,
  documentExtractionIdempotencyKey,
  parseJobOutboxStatus,
  parseJobTypeCode,
  type JobOutboxRecord,
  type JobOutboxStatus,
  type ScheduleDocumentExtractionResult,
} from '../domain/job-outbox.types.js';

type JobOutboxRow = {
  id: string;
  job_type: string;
  document_id: string;
  idempotency_key: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: Date;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
  enqueued_at: Date | null;
  started_at: Date | null;
  finished_at: Date | null;
};

const OUTBOX_COLUMNS = `
  id, job_type, document_id, idempotency_key, status, attempts, max_attempts,
  next_attempt_at, last_error, created_at, updated_at, enqueued_at, started_at, finished_at
`;

function mapRow(row: JobOutboxRow): JobOutboxRecord | null {
  const status = parseJobOutboxStatus(row.status);
  const jobType = parseJobTypeCode(row.job_type);
  if (!status || !jobType) {
    return null;
  }
  return {
    id: row.id,
    jobType,
    documentId: row.document_id,
    idempotencyKey: row.idempotency_key,
    status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    enqueuedAt: row.enqueued_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function requireMapped(row: JobOutboxRow): JobOutboxRecord {
  const mapped = mapRow(row);
  if (!mapped) {
    throw new Error(`Invalid job_outbox row ${row.id}: status=${row.status} type=${row.job_type}`);
  }
  return mapped;
}

@Injectable()
export class PgJobOutboxRepository implements JobOutboxRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async scheduleDocumentExtraction(
    documentId: string,
    options?: { maxAttempts?: number }
  ): Promise<ScheduleDocumentExtractionResult> {
    const maxAttempts = options?.maxAttempts ?? 5;
    const idempotencyKey = documentExtractionIdempotencyKey(documentId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<JobOutboxRow>(
        `SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE idempotency_key = $1 FOR UPDATE`,
        [idempotencyKey]
      );
      const current = existing.rows[0];
      let outboxId: string;
      let created: boolean;

      if (current) {
        const status = parseJobOutboxStatus(current.status);
        if (status === 'pending' || status === 'enqueued' || status === 'running') {
          outboxId = current.id;
          created = false;
        } else {
          const updated = await client.query<JobOutboxRow>(
            `UPDATE job_outbox
             SET status = 'pending',
                 attempts = 0,
                 max_attempts = $2,
                 next_attempt_at = now(),
                 last_error = NULL,
                 enqueued_at = NULL,
                 started_at = NULL,
                 finished_at = NULL,
                 updated_at = now()
             WHERE id = $1
             RETURNING ${OUTBOX_COLUMNS}`,
            [current.id, maxAttempts]
          );
          const row = updated.rows[0];
          if (!row) {
            throw new Error(`Failed to reactivate outbox ${current.id}`);
          }
          outboxId = row.id;
          created = false;
        }
      } else {
        const inserted = await client.query<JobOutboxRow>(
          `INSERT INTO job_outbox (
             job_type, document_id, idempotency_key, status, attempts, max_attempts, next_attempt_at
           ) VALUES ($1, $2, $3, 'pending', 0, $4, now())
           RETURNING ${OUTBOX_COLUMNS}`,
          [JOB_TYPE_DOCUMENT_EXTRACTION, documentId, idempotencyKey, maxAttempts]
        );
        const row = inserted.rows[0];
        if (!row) {
          throw new Error('Failed to insert job_outbox row');
        }
        outboxId = row.id;
        created = true;
      }

      await client.query(
        `UPDATE documents SET status = 'queued', updated_at = now() WHERE id = $1`,
        [documentId]
      );
      await client.query('COMMIT');
      return { outboxId, created };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async claimForRelay(limit: number, leaseOlderThan: Date): Promise<JobOutboxRecord[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const claimed = await client.query<JobOutboxRow>(
        `WITH due AS (
           SELECT id
           FROM job_outbox
           WHERE (
             status = 'pending' AND next_attempt_at <= now()
           ) OR (
             status IN ('enqueued', 'running') AND updated_at < $1
           )
           ORDER BY next_attempt_at ASC, created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT $2
         )
         UPDATE job_outbox AS j
         SET status = 'pending',
             updated_at = now(),
             next_attempt_at = now()
         FROM due
         WHERE j.id = due.id
         RETURNING j.id, j.job_type, j.document_id, j.idempotency_key, j.status, j.attempts,
                   j.max_attempts, j.next_attempt_at, j.last_error, j.created_at, j.updated_at,
                   j.enqueued_at, j.started_at, j.finished_at`,
        [leaseOlderThan, limit]
      );
      await client.query('COMMIT');
      const records: JobOutboxRecord[] = [];
      for (const row of claimed.rows) {
        records.push(requireMapped(row));
      }
      return records;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markEnqueued(outboxId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE job_outbox
       SET status = 'enqueued',
           enqueued_at = now(),
           updated_at = now()
       WHERE id = $1 AND status = 'pending'`,
      [outboxId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async markRunning(outboxId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE job_outbox
       SET status = 'running',
           started_at = COALESCE(started_at, now()),
           updated_at = now(),
           attempts = attempts + 1
       WHERE id = $1 AND status IN ('enqueued', 'pending')`,
      [outboxId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async markDone(outboxId: string): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE job_outbox
       SET status = 'done',
           finished_at = now(),
           updated_at = now(),
           last_error = NULL
       WHERE id = $1 AND status IN ('running', 'enqueued', 'pending')`,
      [outboxId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async markFailedOrRetry(
    outboxId: string,
    errorMessage: string,
    retryDelayMs: number
  ): Promise<JobOutboxStatus> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<JobOutboxRow>(
        `SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE id = $1 FOR UPDATE`,
        [outboxId]
      );
      const row = current.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        throw new Error(`job_outbox ${outboxId} not found`);
      }
      const mapped = requireMapped(row);
      const truncated =
        errorMessage.length > 2000 ? `${errorMessage.slice(0, 1997)}...` : errorMessage;

      if (mapped.attempts >= mapped.maxAttempts) {
        await client.query(
          `UPDATE job_outbox
           SET status = 'failed',
               last_error = $2,
               finished_at = now(),
               updated_at = now()
           WHERE id = $1`,
          [outboxId, truncated]
        );
        await client.query(
          `UPDATE documents SET status = 'failed', updated_at = now() WHERE id = $1`,
          [mapped.documentId]
        );
        await client.query('COMMIT');
        return 'failed';
      }

      await client.query(
        `UPDATE job_outbox
         SET status = 'pending',
             last_error = $2,
             next_attempt_at = now() + make_interval(secs => $3::double precision / 1000.0),
             updated_at = now(),
             enqueued_at = NULL,
             started_at = NULL
         WHERE id = $1`,
        [outboxId, truncated, retryDelayMs]
      );
      await client.query('COMMIT');
      return 'pending';
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(outboxId: string): Promise<JobOutboxRecord | null> {
    const result = await this.pool.query<JobOutboxRow>(
      `SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE id = $1`,
      [outboxId]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }

  async findActiveByDocumentId(documentId: string): Promise<JobOutboxRecord | null> {
    const result = await this.pool.query<JobOutboxRow>(
      `SELECT ${OUTBOX_COLUMNS}
       FROM job_outbox
       WHERE document_id = $1
         AND job_type = $2
         AND status IN ('pending', 'enqueued', 'running')
       ORDER BY created_at DESC
       LIMIT 1`,
      [documentId, JOB_TYPE_DOCUMENT_EXTRACTION]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }
}
