import { v4 as uuidv4 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { splitTextChunksWithSpans } from '../../src/modules/cited-chat/domain/split-text-chunks-with-spans.js';
import { replaceDocumentFieldValues } from '../../src/modules/search/infrastructure/document-field-value-index.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

describe('Global search nonsense queries (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let repo: PgGlobalSearchRepository;
  let userId: string;
  let documentId: string;
  let labelId: string;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
    } finally {
      client.release();
    }
    repo = new PgGlobalSearchRepository(pool);

    documentId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
      ) VALUES ($1, $2, 'vertrag.pdf', 'Vertrag Rechnung', 'application/pdf', 'v/1', 'ready',
        'Monatliche Rechnung.', now(), now())`,
      [documentId, userId]
    );
    await repo.indexDocumentChunks(
      userId,
      documentId,
      splitTextChunksWithSpans('Monatliche Rechnung.')
    );

    await pool.query(
      `INSERT INTO recognized_field_definitions
       (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents)
       VALUES ($1, $2, 'notiz', 'Notiz', 'text', 0, true)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), userId]
    );
    await replaceDocumentFieldValues(pool, documentId, userId, [
      { key: 'global:notiz', value: 'Verweis qwertyuiopasdfg Ende' },
    ]);

    labelId = uuidv4();
    await pool.query(
      `INSERT INTO tags (id, user_id, name, color) VALUES ($1, $2, 'Rechnung Label', '#336699')`,
      [labelId, userId]
    );
    await pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [
      documentId,
      labelId,
    ]);

    await pool.query(
      `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency, updated_at)
       VALUES ($1, 'xyz', 'chunk', 1, now())
       ON CONFLICT (user_id, term) DO NOTHING`,
      [userId]
    );
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('returns no document, label, or title hits for xyzqq', async () => {
    const result = await repo.search(userId, 'xyzqq', {
      includeDocuments: true,
      includeFolders: true,
      includeLabels: true,
      perGroupLimit: 10,
    });
    expect(result.documents).toHaveLength(0);
    expect(result.labels).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
  });

  it('returns no hits for a fifteen-character glued nonsense query', async () => {
    const glued = 'qwertyuiopasdfg';
    const result = await repo.search(userId, glued, {
      includeDocuments: true,
      includeFolders: true,
      includeLabels: true,
      perGroupLimit: 10,
    });
    expect(result.documents).toHaveLength(0);
    expect(result.labels).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
  });

  it('still finds documents for a one-character typo via vocabulary expansion', async () => {
    const typo = await repo.search(userId, 'rechnug', {
      includeDocuments: true,
      includeFolders: false,
      includeLabels: false,
      perGroupLimit: 10,
    });
    expect(typo.documents.length).toBeGreaterThan(0);
  });
});
