// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type { JobOutboxRepository } from '../../../shared/domain/ports.js';
import {
  parseNumber,
  parseOptionalDate,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/domain/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import {
  documentExtractionIdempotencyKey,
  JOB_TYPE_DOCUMENT_EXTRACTION,
  type JobOutboxRecord,
  type JobOutboxStatus,
  parseJobOutboxStatus,
  parseJobTypeCode,
  type ScheduleDocumentExtractionResult,
} from '../domain/job-outbox.types.js';

const OUTBOX_COLUMNS = `
  id, job_type, document_id, user_id, idempotency_key, status, attempts, max_attempts,
  next_attempt_at, last_error, created_at, updated_at, enqueued_at, started_at, finished_at
`;

function mapUnknownRow(raw: unknown): JobOutboxRecord {
  const row = requireRecord(raw);
  const status = parseJobOutboxStatus(parseString(row.status));
  const jobType = parseJobTypeCode(parseString(row.job_type));
  if (!status || !jobType) {
    throw new Error(
      `Invalid job_outbox row ${parseString(row.id)}: status=${String(row.status)} type=${String(row.job_type)}`
    );
  }
  return {
    id: parseString(row.id),
    jobType,
    documentId: parseString(row.document_id),
    userId: parseString(row.user_id),
    idempotencyKey: parseString(row.idempotency_key),
    status,
    attempts: parseNumber(row.attempts),
    maxAttempts: parseNumber(row.max_attempts),
    nextAttemptAt: parseOptionalDate(row.next_attempt_at) ?? new Date(0),
    lastError: parseOptionalString(row.last_error),
    createdAt: parseOptionalDate(row.created_at) ?? new Date(0),
    updatedAt: parseOptionalDate(row.updated_at) ?? new Date(0),
    enqueuedAt: parseOptionalDate(row.enqueued_at),
    startedAt: parseOptionalDate(row.started_at),
    finishedAt: parseOptionalDate(row.finished_at),
  };
}

function mapOptionalRow(raw: unknown): JobOutboxRecord | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  return mapUnknownRow(raw);
}

@Injectable()
export class PgJobOutboxRepository implements JobOutboxRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async scheduleDocumentExtraction(
    documentId: string,
    userId: string,
    options?: { maxAttempts?: number }
  ): Promise<ScheduleDocumentExtractionResult> {
    const maxAttempts = options?.maxAttempts ?? 5;
    const idempotencyKey = documentExtractionIdempotencyKey(documentId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query(`SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE idempotency_key = $1 FOR UPDATE`, [
        idempotencyKey,
      ]);
      const current = mapOptionalRow(existing.rows[0]);
      let outboxId: string;
      let created: boolean;

      if (current) {
        if (current.status === 'pending' || current.status === 'enqueued' || current.status === 'running') {
          outboxId = current.id;
          created = false;
        } else {
          const updated = await client.query(
            `UPDATE job_outbox
             SET status = 'pending',
                 user_id = $2,
                 attempts = 0,
                 max_attempts = $3,
                 next_attempt_at = now(),
                 last_error = NULL,
                 enqueued_at = NULL,
                 started_at = NULL,
                 finished_at = NULL,
                 updated_at = now()
             WHERE id = $1
             RETURNING ${OUTBOX_COLUMNS}`,
            [current.id, userId, maxAttempts]
          );
          const row = mapOptionalRow(updated.rows[0]);
          if (!row) {
            throw new Error(`Failed to reactivate outbox ${current.id}`);
          }
          outboxId = row.id;
          created = false;
        }
      } else {
        const inserted = await client.query(
          `INSERT INTO job_outbox (
             job_type, document_id, user_id, idempotency_key, status, attempts, max_attempts, next_attempt_at
           ) VALUES ($1, $2, $3, $4, 'pending', 0, $5, now())
           RETURNING ${OUTBOX_COLUMNS}`,
          [JOB_TYPE_DOCUMENT_EXTRACTION, documentId, userId, idempotencyKey, maxAttempts]
        );
        const row = mapOptionalRow(inserted.rows[0]);
        if (!row) {
          throw new Error('Failed to insert job_outbox row');
        }
        outboxId = row.id;
        created = true;
      }

      await client.query(
        `UPDATE documents
         SET status = 'queued', extraction_failure_reason = NULL, updated_at = now()
         WHERE id = $1`,
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
      const claimed = await client.query(
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
         RETURNING j.id, j.job_type, j.document_id, j.user_id, j.idempotency_key, j.status,
                   j.attempts, j.max_attempts, j.next_attempt_at, j.last_error, j.created_at,
                   j.updated_at, j.enqueued_at, j.started_at, j.finished_at`,
        [leaseOlderThan, limit]
      );
      await client.query('COMMIT');
      const records: JobOutboxRecord[] = [];
      for (const raw of claimed.rows) {
        records.push(mapUnknownRow(raw));
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
    // Race-safe: the BullMQ worker may markRunning between enqueue and this update.
    const result = await this.pool.query(
      `UPDATE job_outbox
       SET status = CASE WHEN status = 'pending' THEN 'enqueued' ELSE status END,
           enqueued_at = COALESCE(enqueued_at, now()),
           updated_at = now()
       WHERE id = $1 AND status IN ('pending', 'enqueued', 'running')`,
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
      const current = await client.query(`SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE id = $1 FOR UPDATE`, [
        outboxId,
      ]);
      const mapped = mapOptionalRow(current.rows[0]);
      if (!mapped) {
        await client.query('ROLLBACK');
        throw new Error(`job_outbox ${outboxId} not found`);
      }
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
          `UPDATE documents
           SET status = 'failed',
               extraction_failure_reason = $2,
               updated_at = now()
           WHERE id = $1`,
          [mapped.documentId, truncated]
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
    const result = await this.pool.query(`SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE id = $1`, [
      outboxId,
    ]);
    return mapOptionalRow(result.rows[0]);
  }

  async findActiveByDocumentId(documentId: string): Promise<JobOutboxRecord | null> {
    const result = await this.pool.query(
      `SELECT ${OUTBOX_COLUMNS}
       FROM job_outbox
       WHERE document_id = $1
         AND job_type = $2
         AND status IN ('pending', 'enqueued', 'running')
       ORDER BY created_at DESC
       LIMIT 1`,
      [documentId, JOB_TYPE_DOCUMENT_EXTRACTION]
    );
    return mapOptionalRow(result.rows[0]);
  }
}
