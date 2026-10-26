import type pg from 'pg';

const CHUNK_TARGET = 500_000;
/** Many chunks per doc keeps 500k chunk rows without 50k document title/trgm scans. */
const CHUNKS_PER_DOCUMENT = 100;
const DOCUMENT_COUNT = CHUNK_TARGET / CHUNKS_PER_DOCUMENT;

export async function seedGlobalSearchChunkPerfFixture(
  pool: pg.Pool,
  userId: string
): Promise<void> {
  await pool.query(
    `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency)
     VALUES
       ($1, 'rechnung', 'chunk', 1000),
       ($1, 'kontoauszug', 'chunk', 800),
       ($1, 'beratung', 'chunk', 600),
       ($1, 'quartal', 'chunk', 400),
       ($1, 'gebühr', 'chunk', 300)
     ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = EXCLUDED.doc_frequency`,
    [userId]
  );

  await pool.query(
    `WITH inserted_docs AS (
       INSERT INTO documents (
         id, user_id, filename, title, mime_type, storage_key, status, extracted_text, created_at, updated_at
       )
       SELECT
         gen_random_uuid(),
         $1::text,
         'perf-' || gs::text || '.pdf',
         'Dokument ' || gs::text || ' Rechnung Beratung',
         'application/pdf',
         'perf/key/' || gs::text,
         'ready',
         'Monatliche Rechnung und Beratung im Quartal.',
         now(),
         now()
       FROM generate_series(1, $2::int) AS gs
       RETURNING id, filename, (regexp_match(filename, 'perf-([0-9]+)'))[1]::int AS doc_index
     )
     INSERT INTO document_text_chunks (document_id, chunk_index, body, updated_at)
     SELECT d.id,
            c.idx,
            CASE
              WHEN c.idx = 0 AND (d.id::text) LIKE '%0' THEN 'Sonderfall Rechnung Versicherung Vertrag.'
              WHEN c.idx = 1 AND (d.doc_index % 500) = 0 THEN
                'zypperf' || lpad((d.doc_index % 100)::text, 2, '0') || ' Rechnung Beratung'
              ELSE 'Rechnung Beratung Kontoauszug Gebühr Quartal ' || c.idx::text
            END,
            now()
     FROM inserted_docs d
     CROSS JOIN generate_series(0, $3::int - 1) AS c(idx)`,
    [userId, DOCUMENT_COUNT, CHUNKS_PER_DOCUMENT]
  );

  await pool.query('ANALYZE documents');
  await pool.query('ANALYZE document_text_chunks');
  await pool.query('ANALYZE search_vocabulary_terms');
}

export const GLOBAL_SEARCH_PERF_CHUNK_COUNT = CHUNK_TARGET;
