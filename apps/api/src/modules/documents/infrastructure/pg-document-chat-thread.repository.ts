import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  ChatThreadScope,
  DocumentChatMessageEntity,
  DocumentChatMessageGenerationPatch,
  DocumentChatThreadEntity,
  DocumentChatThreadRepository,
} from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { sanitizeChatThreadDocumentIds } from '../domain/chat-thread-document-ids.js';

const DEFAULT_THREAD_TITLE = 'Neuer Chat';

function mapThreadRow(row: Record<string, unknown>): DocumentChatThreadEntity {
  const documentIds = sanitizeChatThreadDocumentIds(row['document_ids']);
  const activeGenRaw = row['active_generation_status'];
  return {
    id: String(row['id']),
    userId: String(row['user_id']),
    title: String(row['title']),
    scope: String(row['scope']) as ChatThreadScope,
    documentIds,
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'])),
    lastMessagePreview:
      row['last_message_preview'] != null ? String(row['last_message_preview']) : null,
    activeGenerationStatus:
      activeGenRaw != null
        ? (String(activeGenRaw) as DocumentChatThreadEntity['activeGenerationStatus'])
        : null,
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
  const generationStatusRaw = row['generation_status'];
  const generationPhaseRaw = row['generation_phase'];
  return {
    id: String(row['id']),
    threadId: String(row['thread_id']),
    role: row['role'] === 'assistant' ? 'assistant' : 'user',
    content: String(row['content']),
    createdAt: new Date(String(row['created_at'])),
    updatedAt: new Date(String(row['updated_at'] ?? row['created_at'])),
    generationStatus:
      generationStatusRaw != null ? (String(generationStatusRaw) as DocumentChatMessageEntity['generationStatus']) : null,
    generationPhase:
      generationPhaseRaw != null ? (String(generationPhaseRaw) as DocumentChatMessageEntity['generationPhase']) : null,
    errorCode: row['error_code'] != null ? String(row['error_code']) : null,
    errorDetail: row['error_detail'] != null ? String(row['error_detail']) : null,
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
    return result.rows.map((row) => mapThreadRow(row as Record<string, unknown>));
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
    return result.rows.map((row) => mapThreadRow(row as Record<string, unknown>));
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
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const threadResult = await client.query(
        `INSERT INTO chat_threads (user_id, title, scope)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, title, scope, created_at, updated_at`,
        [userId, options?.title?.trim() || DEFAULT_THREAD_TITLE, scope]
      );
      const threadRow = threadResult.rows[0] as Record<string, unknown>;
      const threadId = String(threadRow['id']);
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
        title: String(threadRow['title']),
        scope: String(threadRow['scope']) as ChatThreadScope,
        documentIds: [...documentIds],
        createdAt: new Date(String(threadRow['created_at'])),
        updatedAt: new Date(String(threadRow['updated_at'])),
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
    return mapThreadRow(result.rows[0] as Record<string, unknown>);
  }

  async assertThreadLinkedToDocument(
    threadId: string,
    documentId: string,
    userId: string
  ): Promise<DocumentChatThreadEntity> {
    const thread = await this.findThreadForUser(threadId, userId);
    if (!thread || !thread.documentIds.includes(documentId)) {
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
    return result.rows.map((row) => mapMessageRow(row as Record<string, unknown>));
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
    return mapMessageRow(result.rows[0] as Record<string, unknown>);
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
      [
        threadId,
        role,
        content,
        options?.generationStatus ?? null,
        options?.generationPhase ?? null,
      ]
    );
    return mapMessageRow(result.rows[0] as Record<string, unknown>);
  }

  async updateMessageGeneration(
    messageId: string,
    patch: DocumentChatMessageGenerationPatch
  ): Promise<DocumentChatMessageEntity> {
    const sets: string[] = ['updated_at = now()'];
    const values: unknown[] = [messageId];
    let idx = 2;

    if (patch.content !== undefined) {
      sets.push(`content = $${idx++}`);
      values.push(patch.content);
    }
    if (patch.generationStatus !== undefined) {
      sets.push(`generation_status = $${idx++}`);
      values.push(patch.generationStatus);
    }
    if (patch.generationPhase !== undefined) {
      sets.push(`generation_phase = $${idx++}`);
      values.push(patch.generationPhase);
    }
    if (patch.errorCode !== undefined) {
      sets.push(`error_code = $${idx++}`);
      values.push(patch.errorCode);
    }
    if (patch.errorDetail !== undefined) {
      sets.push(`error_detail = $${idx++}`);
      values.push(patch.errorDetail);
    }

    const result = await this.pool.query(
      `UPDATE chat_messages
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, thread_id, role, content, created_at, updated_at,
                 generation_status, generation_phase, error_code, error_detail`,
      values
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Chat message');
    }
    return mapMessageRow(result.rows[0] as Record<string, unknown>);
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
    return mapMessageRow(result.rows[0] as Record<string, unknown>);
  }

  async touchThread(threadId: string): Promise<void> {
    await this.pool.query(`UPDATE chat_threads SET updated_at = now() WHERE id = $1`, [threadId]);
  }

  async updateTitleIfDefault(threadId: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    await this.pool.query(
      `UPDATE chat_threads
       SET title = $2, updated_at = now()
       WHERE id = $1 AND title = $3`,
      [threadId, trimmed, DEFAULT_THREAD_TITLE]
    );
  }

  async failStaleAssistantGenerations(maxAgeMs: number): Promise<number> {
    const result = await this.pool.query(
      `UPDATE chat_messages
       SET generation_status = 'failed',
           generation_phase = NULL,
           error_code = 'generation_timeout',
           error_detail = 'Stale generation reconciled',
           updated_at = now()
       WHERE role = 'assistant'
         AND generation_status IN ('pending', 'streaming')
         AND updated_at < now() - ($1::bigint * interval '1 millisecond')
       RETURNING id`,
      [maxAgeMs]
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
