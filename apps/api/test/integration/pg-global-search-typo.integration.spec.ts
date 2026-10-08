import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { GlobalSearchUseCase } from '../../src/modules/search/application/global-search.use-case.js';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { upsertDocumentFieldValues } from '../../src/modules/search/infrastructure/document-field-value-index.js';
import type { EmbeddingPort } from '../../src/shared/domain/ports.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';
import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';

const noopEmbedding: EmbeddingPort = {
  async embedTexts(texts: string[]) {
    return { embeddings: texts.map(() => []), model: 'noop' };
  },
};

describe('Global search typo correction (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let useCase: GlobalSearchUseCase;
  let repo: PgGlobalSearchRepository;
  let userId: string;
  let rechnungDocId: string;
  let kontoauszugDocId: string;

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
    useCase = new GlobalSearchUseCase(repo, noopEmbedding);

    await pool.query(
      `INSERT INTO recognized_field_definitions
       (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents)
       VALUES ($1,$2,'absender','Absender','text',0,true)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), userId]
    );

    rechnungDocId = uuidv4();
    kontoauszugDocId = uuidv4();
    await pool.query(
      `INSERT INTO documents (
        id, user_id, filename, title, mime_type, storage_key, status, extracted_text, extracted_fields, created_at, updated_at
      ) VALUES ($1,$2,'rechnung.pdf','Rechnung Nordwind GmbH','application/pdf','k/r','ready',
        'Rechnung über Beratungsleistungen.', '{}'::jsonb, now(), now()),
      ($3,$2,'kontoauszug.pdf','Kontoauszug Nordwind','application/pdf','k/k','ready',
        'Der monatliche Kontoauszug weist eine Gebühr aus.', '{}'::jsonb, now(), now())`,
      [rechnungDocId, userId, kontoauszugDocId]
    );
    await repo.indexDocumentChunks(
      userId,
      rechnungDocId,
      'Rechnung über Beratungsleistungen im ersten Quartal.'
    );
    await repo.indexDocumentChunks(
      userId,
      kontoauszugDocId,
      'Der monatliche Kontoauszug weist eine Gebühr für den Zahlungsverkehr aus.'
    );

    const defs = await repo.listFieldDefinitions(userId);
    const lookup = new Map(
      defs.map((d) => [
        d.storageKey,
        { storageKey: d.storageKey, label: d.label, fieldType: d.fieldType },
      ])
    );
    await upsertDocumentFieldValues(
      pool,
      userId,
      rechnungDocId,
      [{ key: 'global:absender', value: 'Nordwind GmbH' }],
      lookup
    );
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  async function docTitles(query: string): Promise<string[]> {
    const res = await useCase.execute(userId, { q: query, types: 'documents', limit: 8 });
    const docs = res.groups.find((g) => g.type === 'documents')?.items ?? [];
    return docs.filter((i) => i.type === 'document').map((i) => i.title);
  }

  it('Rehcnung → Rechnung Nordwind GmbH', async () => {
    const titles = await docTitles('Rehcnung');
    expect(titles.some((t) => t.includes('Rechnung Nordwind'))).toBe(true);
  });

  it('Nordwnd → Nordwind (field / title)', async () => {
    const titles = await docTitles('Nordwnd');
    expect(titles.some((t) => t.toLowerCase().includes('nordwind'))).toBe(true);
  });

  it('Kontoauzug → Kontoauszug', async () => {
    const titles = await docTitles('Kontoauzug');
    expect(titles.some((t) => t.includes('Kontoauszug'))).toBe(true);
  });

  it('typo in custom field value (absender) via scoped query', async () => {
    const res = await useCase.execute(userId, {
      q: 'absender:nordwnd',
      types: 'documents',
      limit: 5,
    });
    const docs = res.groups.find((g) => g.type === 'documents')?.items ?? [];
    expect(docs.some((d) => d.type === 'document' && d.title.includes('Rechnung'))).toBe(true);
  });

  it('gibberish returns no documents', async () => {
    const titles = await docTitles('zzqqnoexist');
    expect(titles.length).toBe(0);
  });
});
