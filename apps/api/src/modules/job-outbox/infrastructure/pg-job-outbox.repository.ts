// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { ForbiddenError } from '../../../shared/domain/errors.js';
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
  type JobOutboxRelayClaim,
  type JobOutboxStatus,
  OUTBOX_ATTEMPTS_EXHAUSTED_REASON,
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
      const owned = await client.query<{ status: string }>(
        `SELECT status FROM documents WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [documentId, userId]
      );
      const documentStatus = owned.rows[0]?.status;
      if (!documentStatus) {
        throw new ForbiddenError('document');
      }
      const existing = await client.query(
        `SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE idempotency_key = $1 FOR UPDATE`,
        [idempotencyKey]
      );
      const current = mapOptionalRow(existing.rows[0]);
      let outboxId: string;
      let created: boolean;

      if (current) {
        if (
          current.status === 'pending' ||
          current.status === 'enqueued' ||
          current.status === 'running'
        ) {
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

      const outboxStillActive =
        current !== null &&
        (current.status === 'pending' ||
          current.status === 'enqueued' ||
          current.status === 'running');
      if (!(outboxStillActive && documentStatus === 'extracting')) {
        await client.query(
          `UPDATE documents
           SET status = 'queued', extraction_failure_reason = NULL, updated_at = now()
           WHERE id = $1 AND user_id = $2`,
          [documentId, userId]
        );
      }
      await client.query('COMMIT');
      return { outboxId, created };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async claimForRelay(limit: number, claim: JobOutboxRelayClaim): Promise<JobOutboxRecord[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const due = await client.query<{ id: string }>(
        `SELECT id
         FROM job_outbox
         WHERE (
           status = 'pending' AND next_attempt_at <= now()
         ) OR (
           status = 'enqueued' AND updated_at < $1
         ) OR (
           status = 'running' AND updated_at < $2
         )
         ORDER BY next_attempt_at ASC, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $3`,
        [claim.enqueuedLeaseOlderThan, claim.runningLeaseOlderThan, limit]
      );
      const ids: string[] = [];
      for (const raw of due.rows) {
        ids.push(parseString(requireRecord(raw).id));
      }
      if (ids.length === 0) {
        await client.query('COMMIT');
        return [];
      }
      await client.query(
        `UPDATE job_outbox
         SET status = 'failed',
             last_error = COALESCE(NULLIF(last_error, ''), $2),
             finished_at = now(),
             updated_at = now()
         WHERE id = ANY($1::uuid[])
           AND attempts >= max_attempts`,
        [ids, OUTBOX_ATTEMPTS_EXHAUSTED_REASON]
      );
      await client.query(
        `UPDATE documents AS d
         SET status = 'failed',
             extraction_failure_reason = left(j.last_error, 2000),
             updated_at = now()
         FROM job_outbox AS j
         WHERE j.id = ANY($1::uuid[])
           AND j.status = 'failed'
           AND d.id = j.document_id
           AND d.user_id = j.user_id
           AND d.status IN ('queued', 'extracting', 'uploaded')`,
        [ids]
      );
      const claimed = await client.query(
        `UPDATE job_outbox AS j
         SET status = 'pending',
             updated_at = now(),
             next_attempt_at = now()
         WHERE j.id = ANY($1::uuid[])
           AND j.attempts < j.max_attempts
           AND j.status IN ('pending', 'enqueued', 'running')
         RETURNING ${OUTBOX_COLUMNS}`,
        [ids]
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
    retryDelayMs: number,
    options?: { allowRetry?: boolean }
  ): Promise<JobOutboxStatus> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT ${OUTBOX_COLUMNS} FROM job_outbox WHERE id = $1 FOR UPDATE`,
        [outboxId]
      );
      const mapped = mapOptionalRow(current.rows[0]);
      if (!mapped) {
        await client.query('ROLLBACK');
        throw new Error(`job_outbox ${outboxId} not found`);
      }
      const truncated =
        errorMessage.length > 2000 ? `${errorMessage.slice(0, 1997)}...` : errorMessage;
      const allowRetry = options?.allowRetry !== false;

      if (!allowRetry || mapped.attempts >= mapped.maxAttempts) {
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
           WHERE id = $1 AND user_id = $3`,
          [mapped.documentId, truncated, mapped.userId]
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
