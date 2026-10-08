#!/usr/bin/env node
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../../../apps/api/package.json', import.meta.url));
const pg = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const EMAIL = process.env.SEED_EMAIL ?? 'search-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'SearchScreenshot1!';

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Search Screenshots' }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`sign-up ${res.status}: ${await res.text()}`);
  }
}

async function upsertField(pool, userId, documentId, row) {
  await pool.query(
    `INSERT INTO document_field_values (
       document_id, user_id, field_storage_key, field_label, field_type,
       value_text, value_text_norm, value_numeric, value_date, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date, now())
     ON CONFLICT (document_id, field_storage_key) DO UPDATE SET
       value_text = EXCLUDED.value_text,
       value_text_norm = EXCLUDED.value_text_norm,
       value_numeric = EXCLUDED.value_numeric,
       value_date = EXCLUDED.value_date,
       updated_at = now()`,
    [
      documentId,
      userId,
      row.storageKey,
      row.label,
      row.type,
      row.text,
      row.textNorm,
      row.numeric,
      row.dateIso,
    ]
  );
}

async function main() {
  await ensureUser();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const userRow = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [EMAIL]);
  const userId = userRow.rows[0]?.id;
  if (!userId) throw new Error('user missing');

  for (const key of ['absender', 'betrag', 'rechnungsdatum', 'iban', 'rechnungsnummer']) {
    const labels = {
      absender: 'Absender',
      betrag: 'Betrag',
      rechnungsdatum: 'Rechnungsdatum',
      iban: 'IBAN',
      rechnungsnummer: 'Rechnungsnummer',
    };
    const types = {
      absender: 'text',
      betrag: 'currency',
      rechnungsdatum: 'date',
      iban: 'text',
      rechnungsnummer: 'text',
    };
    await pool.query(
      `INSERT INTO recognized_field_definitions
       (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents)
       VALUES ($1,$2,$3,$4,$5,0,true)
       ON CONFLICT (user_id, field_key) DO NOTHING`,
      [randomUUID(), userId, key, labels[key], types[key]]
    );
  }

  await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  const semanticId = randomUUID();
  const typoId = randomUUID();
  const rechnungFields = {
    fields: [
      { key: 'global:absender', value: 'Nordwind GmbH' },
      { key: 'global:betrag', value: '12,50 €' },
      { key: 'global:rechnungsdatum', value: '15.03.2024' },
      { key: 'global:iban', value: 'DE89370400440532013000' },
      { key: 'global:rechnungsnummer', value: 'INV-2024-77' },
    ],
  };
  await pool.query(
    `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, extracted_fields, created_at, updated_at)
     VALUES ($1,$2,'kontoauszug.pdf','Kontoauszug Nordwind','application/pdf','k/1','ready',
     'Der monatliche Kontoauszug weist eine Gebühr für den Zahlungsverkehr aus.', '{}'::jsonb, now(), now())`,
    [semanticId, userId]
  );
  await pool.query(
    `INSERT INTO document_text_chunks (document_id, user_id, chunk_index, body, updated_at)
     VALUES ($1,$2,0,'Der monatliche Kontoauszug weist eine Gebühr für den Zahlungsverkehr aus.', now())`,
    [semanticId, userId]
  );
  await pool.query(
    `INSERT INTO documents (id, user_id, filename, title, mime_type, storage_key, status, extracted_text, extracted_fields, created_at, updated_at)
     VALUES ($1,$2,'rechnung.pdf','Rechnung Nordwind GmbH','application/pdf','k/2','ready',
     'Rechnung über Beratungsleistungen im ersten Quartal.', $3::jsonb, now(), now())`,
    [typoId, userId, JSON.stringify(rechnungFields)]
  );
  await pool.query(
    `INSERT INTO document_text_chunks (document_id, user_id, chunk_index, body, updated_at)
     VALUES ($1,$2,0,'Rechnung über Beratungsleistungen im ersten Quartal.', now())`,
    [typoId, userId]
  );
  await upsertField(pool, userId, typoId, {
    storageKey: 'global:absender',
    label: 'Absender',
    type: 'text',
    text: 'Nordwind GmbH',
    textNorm: 'nordwind gmbh',
    numeric: null,
    dateIso: null,
  });
  await upsertField(pool, userId, typoId, {
    storageKey: 'global:betrag',
    label: 'Betrag',
    type: 'currency',
    text: '12,50 €',
    textNorm: '12,50',
    numeric: 12.5,
    dateIso: null,
  });
  await upsertField(pool, userId, typoId, {
    storageKey: 'global:rechnungsdatum',
    label: 'Rechnungsdatum',
    type: 'date',
    text: '15.03.2024',
    textNorm: '15.03.2024',
    numeric: null,
    dateIso: '2024-03-15',
  });
  await pool.query(
    `INSERT INTO folders (id, user_id, name, created_at, updated_at) VALUES ($1,$2,'Projekt Alpha', now(), now())
     ON CONFLICT DO NOTHING`,
    [randomUUID(), userId]
  );
  await pool.query(
    `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
     VALUES ($1,$2,'Finanzen','#2a9d6f',false,'none','') ON CONFLICT DO NOTHING`,
    [randomUUID(), userId]
  );

  async function seedVocabulary(text, source) {
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    for (const term of [...new Set(tokens)].filter((t) => t.length >= 3 && t.length <= 48).slice(0, 200)) {
      await pool.query(
        `INSERT INTO search_vocabulary_terms (user_id, term, source, doc_frequency)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, term) DO UPDATE SET doc_frequency = search_vocabulary_terms.doc_frequency + 1`,
        [userId, term, source]
      );
    }
  }
  await seedVocabulary('Kontoauszug Nordwind Der monatliche Kontoauszug', 'document');
  await seedVocabulary('Rechnung Nordwind GmbH Rechnung über Beratungsleistungen', 'document');
  await seedVocabulary('Nordwind GmbH', 'chunk');

  await pool.end();
  console.log(JSON.stringify({ email: EMAIL, password: PASSWORD, userId }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
