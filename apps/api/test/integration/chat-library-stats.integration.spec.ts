// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatStatsAnswer } from '../../src/modules/cited-chat/domain/format-stats-answer.js';
import { PgChatLibraryStatsRepository } from '../../src/modules/cited-chat/infrastructure/pg-chat-library-stats.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('chat library stats (Testcontainers)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let tagId: string;
  let statsRepo: PgChatLibraryStatsRepository;

  beforeAll(async () => {
    userId = newIsolationUserId();
    tagId = randomUUID();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Stats',
        email: `${userId}@example.test`,
      });
      await client.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox)
         VALUES ($1, $2, 'Entgeltnachweis', '#336699', false)`,
        [tagId, userId]
      );
      for (let i = 0; i < 2; i += 1) {
        const docId = randomUUID();
        await client.query(
          `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status)
           VALUES ($1, $2, $3, $4, 'application/pdf', 'k/stats', 'ready')`,
          [docId, userId, `lohn-${String(i)}.pdf`, `Entgelt ${String(i)}`]
        );
        await client.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [
          docId,
          tagId,
        ]);
      }
    } finally {
      client.release();
    }
    statsRepo = new PgChatLibraryStatsRepository(pool);
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  it('counts Entgeltnachweise and formats markdown document links', async () => {
    const count = await statsRepo.countDocuments(userId, { tagId });
    expect(count).toBe(2);

    const resolved = await statsRepo.resolveStatsQuery(userId, 'count_by_label', tagId);
    expect(resolved.count).toBe(2);
    expect(resolved.documents).toHaveLength(2);

    const answer = formatStatsAnswer({
      locale: 'de',
      operation: 'count_by_label',
      labelName: 'Entgeltnachweis',
      count: resolved.count,
      documents: resolved.documents,
    });
    expect(answer).toContain('**2**');
    expect(answer).toContain('Entgeltnachweis');
    for (const doc of resolved.documents) {
      expect(answer).toContain(`/documents/${doc.id}`);
      expect(answer).toContain(doc.title);
    }
  });
});
