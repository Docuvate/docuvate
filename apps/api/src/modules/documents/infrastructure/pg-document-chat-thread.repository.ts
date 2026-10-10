// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  ChatThreadScope,
  DocumentChatGenerationPhase,
  DocumentChatGenerationStatus,
  DocumentChatMessageEntity,
  DocumentChatMessageGenerationPatch,
  DocumentChatThreadEntity,
  DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import {
  parseDate,
  parseEnum,
  parseOptionalEnum,
  parseOptionalString,
  parseString,
  requireRecord,
} from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { sanitizeChatThreadDocumentIds } from '../domain/chat-thread-document-ids.js';
import { PLACEHOLDER_CHAT_THREAD_TITLES } from '../application/chat-thread-title.js';

const DEFAULT_THREAD_TITLE = 'Neuer Chat';

const CHAT_THREAD_SCOPES: readonly ChatThreadScope[] = ['document', 'library'];
const GENERATION_STATUSES: readonly DocumentChatGenerationStatus[] = [
  'pending',
  'streaming',
  'done',
  'failed',
];
const GENERATION_PHASES: readonly DocumentChatGenerationPhase[] = [
  'retrieving',
  'generating',
  'verifying',
];

function mapThreadRow(row: Record<string, unknown>): DocumentChatThreadEntity {
  const documentIds = sanitizeChatThreadDocumentIds(row.document_ids);
  const activeGenerationStatus = parseOptionalEnum(row.active_generation_status, GENERATION_STATUSES);
  return {
    id: parseString(row.id),
    userId: parseString(row.user_id),
    title: parseString(row.title),
    scope: parseEnum(row.scope, CHAT_THREAD_SCOPES, 'document'),
    documentIds,
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
    lastMessagePreview: parseOptionalString(row.last_message_preview),
    activeGenerationStatus,
  };
}

const THREAD_LIST_SELECT = `
         t.id,
         t.user_id,
         t.title,
         t.scope,
         t.created_at,
         t.updated_at,
         COALESCE(
           array_remove(array_agg(ctd.document_id ORDER BY ctd.linked_at), NULL),
           '{}'::uuid[]
         ) AS document_ids,
         (
           SELECT m.content
           FROM chat_messages m
           WHERE m.thread_id = t.id
           ORDER BY m.created_at DESC
           LIMIT 1
         ) AS last_message_preview,
         (
           SELECT m.generation_status
           FROM chat_messages m
           WHERE m.thread_id = t.id
             AND m.role = 'assistant'
             AND m.generation_status IN ('pending', 'streaming')
           ORDER BY m.created_at DESC
           LIMIT 1
         ) AS active_generation_status`;

function mapMessageRow(row: Record<string, unknown>): DocumentChatMessageEntity {
  const updatedAtRaw = row.updated_at ?? row.created_at;
  return {
    id: parseString(row.id),
    threadId: parseString(row.thread_id),
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: parseString(row.content),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(updatedAtRaw),
    generationStatus: parseOptionalEnum(row.generation_status, GENERATION_STATUSES),
    generationPhase: parseOptionalEnum(row.generation_phase, GENERATION_PHASES),
    errorCode: parseOptionalString(row.error_code),
    errorDetail: parseOptionalString(row.error_detail),
  };
}

@Injectable()
export class PgDocumentChatThreadRepository implements DocumentChatThreadRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listThreadsForLibrary(userId: string): Promise<DocumentChatThreadEntity[]> {
    const result = await this.pool.query(
      `SELECT ${THREAD_LIST_SELECT}
       FROM chat_threads t
       LEFT JOIN chat_thread_documents ctd ON ctd.thread_id = t.id
       WHERE t.user_id = $1 AND t.scope = 'library'
       GROUP BY t.id
       ORDER BY t.updated_at DESC`,
      [userId]
    );
    return result.rows.map((raw) => mapThreadRow(requireRecord(raw)));
  }

  async listThreadsForDocument(
    documentId: string,
    userId: string
  ): Promise<DocumentChatThreadEntity[]> {
    const result = await this.pool.query(
      `SELECT ${THREAD_LIST_SELECT}
       FROM chat_threads t
       INNER JOIN chat_thread_documents ctd ON ctd.thread_id = t.id
       WHERE ctd.document_id = $1 AND t.user_id = $2
       GROUP BY t.id
       ORDER BY t.updated_at DESC`,
      [documentId, userId]
    );
    return result.rows.map((raw) => mapThreadRow(requireRecord(raw)));
  }

  async createThread(
    userId: string,
    documentIds: string[],
    options?: { title?: string; scope?: ChatThreadScope }
  ): Promise<DocumentChatThreadEntity> {
    const scope = options?.scope ?? 'document';
    if (scope === 'document' && documentIds.length === 0) {
      throw new Error('At least one document is required for a document-scoped chat thread');
    }
    const titleCandidate = options?.title?.trim();
    const title =
      titleCandidate && titleCandidate.length > 0 ? titleCandidate : DEFAULT_THREAD_TITLE;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const threadResult = await client.query(
        `INSERT INTO chat_threads (user_id, title, scope)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, title, scope, created_at, updated_at`,
        [userId, title, scope]
      );
      const threadRow = requireRecord(threadResult.rows[0]);
      const threadId = parseString(threadRow.id);
      for (const documentId of documentIds) {
        await client.query(
          `INSERT INTO chat_thread_documents (thread_id, document_id)
           VALUES ($1, $2)`,
          [threadId, documentId]
        );
      }
      await client.query('COMMIT');
      return {
        id: threadId,
        userId,
        title: parseString(threadRow.title),
        scope: parseEnum(threadRow.scope, CHAT_THREAD_SCOPES, 'document'),
        documentIds: [...documentIds],
        createdAt: parseDate(threadRow.created_at),
        updatedAt: parseDate(threadRow.updated_at),
        lastMessagePreview: null,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findThreadForUser(
    threadId: string,
    userId: string
  ): Promise<DocumentChatThreadEntity | null> {
    const result = await this.pool.query(
      `SELECT ${THREAD_LIST_SELECT}
       FROM chat_threads t
       LEFT JOIN chat_thread_documents ctd ON ctd.thread_id = t.id
       WHERE t.id = $1 AND t.user_id = $2
       GROUP BY t.id`,
      [threadId, userId]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return mapThreadRow(requireRecord(result.rows[0]));
  }

  async assertThreadLinkedToDocument(
    threadId: string,
    documentId: string,
    userId: string
  ): Promise<DocumentChatThreadEntity> {
    const thread = await this.findThreadForUser(threadId, userId);
    if (!thread?.documentIds.includes(documentId)) {
      throw new NotFoundError('Chat thread');
    }
    return thread;
  }

  async listMessages(threadId: string, userId: string): Promise<DocumentChatMessageEntity[]> {
    await this.assertThreadExistsForUser(threadId, userId);
    const result = await this.pool.query(
      `SELECT id, thread_id, role, content, created_at, updated_at,
              generation_status, generation_phase, error_code, error_detail
       FROM chat_messages
       WHERE thread_id = $1
       ORDER BY created_at ASC`,
      [threadId]
    );
    return result.rows.map((raw) => mapMessageRow(requireRecord(raw)));
  }

  async findMessageForUser(
    messageId: string,
    userId: string
  ): Promise<DocumentChatMessageEntity | null> {
    const result = await this.pool.query(
      `SELECT m.id, m.thread_id, m.role, m.content, m.created_at, m.updated_at,
              m.generation_status, m.generation_phase, m.error_code, m.error_detail
       FROM chat_messages m
       INNER JOIN chat_threads t ON t.id = m.thread_id
       WHERE m.id = $1 AND t.user_id = $2`,
      [messageId, userId]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return mapMessageRow(requireRecord(result.rows[0]));
  }

  async appendMessage(
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
    options?: {
      generationStatus?: DocumentChatMessageEntity['generationStatus'];
      generationPhase?: DocumentChatMessageEntity['generationPhase'];
    }
  ): Promise<DocumentChatMessageEntity> {
    const result = await this.pool.query(
      `INSERT INTO chat_messages (thread_id, role, content, generation_status, generation_phase)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, thread_id, role, content, created_at, updated_at,
                 generation_status, generation_phase, error_code, error_detail`,
      [threadId, role, content, options?.generationStatus ?? null, options?.generationPhase ?? null]
    );
    return mapMessageRow(requireRecord(result.rows[0]));
  }

  async updateMessageGeneration(
    messageId: string,
    patch: DocumentChatMessageGenerationPatch
  ): Promise<DocumentChatMessageEntity> {
    const sets: string[] = ['updated_at = now()'];
    const values: unknown[] = [messageId];
    let idx = 2;

    if (patch.content !== undefined) {
      sets.push(`content = $${String(idx)}`);
      idx += 1;
      values.push(patch.content);
    }
    if (patch.generationStatus !== undefined) {
      sets.push(`generation_status = $${String(idx)}`);
      idx += 1;
      values.push(patch.generationStatus);
    }
    if (patch.generationPhase !== undefined) {
      sets.push(`generation_phase = $${String(idx)}`);
      idx += 1;
      values.push(patch.generationPhase);
    }
    if (patch.errorCode !== undefined) {
      sets.push(`error_code = $${String(idx)}`);
      idx += 1;
      values.push(patch.errorCode);
    }
    if (patch.errorDetail !== undefined) {
      sets.push(`error_detail = $${String(idx)}`);
      idx += 1;
      values.push(patch.errorDetail);
    }

    const terminal =
      patch.generationStatus === 'done' || patch.generationStatus === 'failed';
    const inFlightGuard =
      patch.finalizeOnlyIfInFlight === true && terminal
        ? ` AND generation_status IN ('pending', 'streaming')`
        : '';

    const result = await this.pool.query(
      `UPDATE chat_messages
       SET ${sets.join(', ')}
       WHERE id = $1${inFlightGuard}
       RETURNING id, thread_id, role, content, created_at, updated_at,
                 generation_status, generation_phase, error_code, error_detail`,
      values
    );
    if (result.rows.length === 0) {
      if (patch.finalizeOnlyIfInFlight === true && terminal) {
        const existing = await this.pool.query(
          `SELECT id, thread_id, role, content, created_at, updated_at,
                  generation_status, generation_phase, error_code, error_detail
           FROM chat_messages WHERE id = $1`,
          [messageId]
        );
        if (existing.rows.length > 0) {
          return mapMessageRow(requireRecord(existing.rows[0]));
        }
      }
      throw new NotFoundError('Chat message');
    }
    return mapMessageRow(requireRecord(result.rows[0]));
  }

  async touchMessageGenerationHeartbeat(messageId: string): Promise<void> {
    await this.pool.query(
      `UPDATE chat_messages
       SET updated_at = now()
       WHERE id = $1 AND generation_status IN ('pending', 'streaming')`,
      [messageId]
    );
  }

  async resetMessageForRetry(messageId: string): Promise<DocumentChatMessageEntity> {
    const result = await this.pool.query(
      `UPDATE chat_messages
       SET content = '',
           generation_status = 'pending',
           generation_phase = NULL,
           error_code = NULL,
           error_detail = NULL,
           updated_at = now()
       WHERE id = $1 AND role = 'assistant'
       RETURNING id, thread_id, role, content, created_at, updated_at,
                 generation_status, generation_phase, error_code, error_detail`,
      [messageId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Chat message');
    }
    return mapMessageRow(requireRecord(result.rows[0]));
  }

  async touchThread(threadId: string): Promise<void> {
    await this.pool.query(`UPDATE chat_threads SET updated_at = now() WHERE id = $1`, [threadId]);
  }

  async updateTitleIfDefault(threadId: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    const placeholders = [...PLACEHOLDER_CHAT_THREAD_TITLES, DEFAULT_THREAD_TITLE];
    await this.pool.query(
      `UPDATE chat_threads
       SET title = $2, updated_at = now()
       WHERE id = $1 AND title = ANY($3::text[])`,
      [threadId, trimmed, placeholders]
    );
  }

  async listInFlightAssistantMessageIdsOlderThan(maxAgeMs: number): Promise<string[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id
       FROM chat_messages
       WHERE role = 'assistant'
         AND generation_status IN ('pending', 'streaming')
         AND updated_at < now() - ($1::bigint * interval '1 millisecond')`,
      [maxAgeMs]
    );
    return result.rows.map((row) => row.id);
  }

  async failAssistantGenerationsByIds(messageIds: string[]): Promise<number> {
    if (messageIds.length === 0) {
      return 0;
    }
    const result = await this.pool.query(
      `UPDATE chat_messages
       SET generation_status = 'failed',
           generation_phase = NULL,
           error_code = 'generation_timeout',
           error_detail = 'Stale generation reconciled',
           updated_at = now()
       WHERE id = ANY($1::uuid[])
         AND role = 'assistant'
         AND generation_status IN ('pending', 'streaming')
       RETURNING id`,
      [messageIds]
    );
    return result.rowCount ?? 0;
  }

  private async assertThreadExistsForUser(threadId: string, userId: string): Promise<void> {
    const result = await this.pool.query(
      `SELECT 1 FROM chat_threads WHERE id = $1 AND user_id = $2`,
      [threadId, userId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Chat thread');
    }
  }
}
