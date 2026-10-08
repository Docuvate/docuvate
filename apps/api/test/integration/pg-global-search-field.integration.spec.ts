import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { PgGlobalSearchRepository } from '../../src/modules/search/infrastructure/pg-global-search.repository.js';
import { GlobalSearchUseCase } from '../../src/modules/search/application/global-search.use-case.js';
import {
  FIELD_TYPO_SEARCH_CORPUS,
  recallFieldAtK,
} from '../../src/modules/search/domain/field-typo-corpus.js';
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

describe('Global search field values (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let useCase: GlobalSearchUseCase;
  let repo: PgGlobalSearchRepository;
  let userId: string;

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
       VALUES ($1,$2,'absender','Absender','text',0,true),
              ($3,$2,'betrag','Betrag','currency',1,true),
              ($4,$2,'rechnungsdatum','Rechnungsdatum','date',2,true),
              ($5,$2,'iban','IBAN','text',3,true),
              ($6,$2,'rechnungsnummer','Rechnungsnummer','text',4,true)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), userId, uuidv4(), uuidv4(), uuidv4(), uuidv4()]
    );

    const docId = uuidv4();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, extracted_fields, created_at, updated_at)
       VALUES ($1,$2,'r.pdf','Rechnung Nordwind GmbH','application/pdf','k/1','ready','text',
       $3::jsonb, now(), now())`,
      [
        docId,
        userId,
        JSON.stringify({
          fields: [
            { key: 'global:absender', value: 'Nordwind GmbH' },
            { key: 'global:betrag', value: '12,50 €' },
            { key: 'global:rechnungsdatum', value: '15.03.2024' },
            { key: 'global:iban', value: 'DE89370400440532013000' },
            { key: 'global:rechnungsnummer', value: 'INV-2024-77' },
          ],
        }),
      ]
    );
    const acmeId = uuidv4();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, extracted_fields, created_at, updated_at)
       VALUES ($1,$2,'i.pdf','Invoice Acme Corp','application/pdf','k/2','ready','text',
       $3::jsonb, now(), now())`,
      [
        acmeId,
        userId,
        JSON.stringify({
          fields: [
            { key: 'global:absender', value: 'Acme Corp' },
            { key: 'global:betrag', value: 'EUR 99.00' },
            { key: 'global:rechnungsdatum', value: '2024-03-15' },
          ],
        }),
      ]
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
      docId,
      [
        { key: 'global:absender', value: 'Nordwind GmbH' },
        { key: 'global:betrag', value: '12,50 €' },
        { key: 'global:rechnungsdatum', value: '15.03.2024' },
        { key: 'global:iban', value: 'DE89370400440532013000' },
        { key: 'global:rechnungsnummer', value: 'INV-2024-77' },
      ],
      lookup
    );
    await upsertDocumentFieldValues(
      pool,
      userId,
      acmeId,
      [
        { key: 'global:absender', value: 'Acme Corp' },
        { key: 'global:betrag', value: 'EUR 99.00' },
        { key: 'global:rechnungsdatum', value: '2024-03-15' },
      ],
      lookup
    );
  }, 120_000);

  afterAll(async () => {
    await closeIntegrationPool();
  });

  it('field typo corpus recall@5 via GlobalSearchUseCase (HTTP-equivalent path)', async () => {
    let hits = 0;
    for (const c of FIELD_TYPO_SEARCH_CORPUS) {
      const res = await useCase.execute(userId, { q: c.query, types: 'documents', limit: 5 });
      const docs = res.groups.find((g) => g.type === 'documents')?.items ?? [];
      const mapped = docs
        .filter((item) => item.type === 'document')
        .map((item) => ({ title: item.title, snippet: item.snippet }));
      if (recallFieldAtK(mapped, c.expectedTitleNeedle, c.expectedValueNeedle, 5)) {
        hits += 1;
      }
    }
    const recall = hits / FIELD_TYPO_SEARCH_CORPUS.length;
    // eslint-disable-next-line no-console -- PR benchmark artifact
    console.info(`field_typo_corpus_recall_at_5=${recall.toFixed(3)} n=${FIELD_TYPO_SEARCH_CORPUS.length}`);
    expect(recall).toBeGreaterThanOrEqual(0.75);
  });
});
