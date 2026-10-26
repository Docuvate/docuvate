#!/usr/bin/env node
/**
 * Seeds the E2E smoke user with 5_000 documents and 300 labels for library perf tests.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'smoke.bench@fixture.docuvate.test';
const DOC_COUNT = Number(process.env.LIBRARY_PERF_DOC_COUNT ?? '5000');
const LABEL_COUNT = Number(process.env.LIBRARY_PERF_LABEL_COUNT ?? '300');
const REVIEW_PENDING_COUNT = Number(process.env.LIBRARY_PERF_REVIEW_PENDING_COUNT ?? '0');

const LONG_TITLE_PREFIX =
  'Sehr langer Dokumenttitel für Layout-Regressionstests mit virtuellem Scrollen und mehrzeiligen Metadaten ';
const LONG_LABEL_NAMES = [
  'Versicherungsnachweis-Krankenhausaufenthalt',
  'Steuerbescheid-Einkommen-Nachzahlung',
  'Mietvertrag-Nebenkostenabrechnung-2024',
];

async function main() {
  const { createRequire } = await import('node:module');
  const { randomUUID } = await import('node:crypto');
  const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const userRow = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [EMAIL]);
    const userId = userRow.rows[0]?.id;
    if (!userId) {
      throw new Error(`Smoke user not found: ${EMAIL}`);
    }

    const secondUserId = randomUUID();
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, now(), now())
       ON CONFLICT (email) DO NOTHING`,
      [secondUserId, 'Fixture Second User', 'fixture.second@fixture.docuvate.test']
    );

    await pool.query(`DELETE FROM documents WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM tags WHERE user_id = $1`, [userId]);

    const tagIds = [];
    for (let i = 0; i < LABEL_COUNT; i += 1) {
      const id = randomUUID();
      tagIds.push(id);
      const name =
        i < LONG_LABEL_NAMES.length
          ? LONG_LABEL_NAMES[i]
          : `perf-label-${String(i).padStart(4, '0')}`;
      await pool.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox, created_at, updated_at)
         VALUES ($1, $2, $3, '#888888', false, now(), now())`,
        [id, userId, name]
      );
    }

    const now = Date.now();
    let showcaseDocumentId = null;
    for (let i = 0; i < DOC_COUNT; i += 1) {
      const id = randomUUID();
      const updatedAt = new Date(now - i * 1000);
      const isShowcase = i === 0;
      const title = isShowcase
        ? `${LONG_TITLE_PREFIX}${String(i)}`
        : i < 40
          ? `${LONG_TITLE_PREFIX}${String(i)}`
          : `Perf document ${String(i)}`;
      const filename = isShowcase ? 'paperless-import-placeholder.pdf' : `perf-${String(i)}.pdf`;
      await pool.query(
        `INSERT INTO documents (
          id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at
        ) VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', $6, $6)`,
        [id, userId, filename, title, `perf/${id}`, updatedAt]
      );
      if (isShowcase) {
        showcaseDocumentId = id;
      }
      if (i < 40) {
        await pool.query(
          `INSERT INTO document_field_values (
             document_id, field_storage_key, value_text, confidence,
             value_text_norm, value_numeric, value_date
           ) VALUES ($1, 'global:absender', $2, 1, lower($2), NULL, NULL)
           ON CONFLICT (document_id, field_storage_key) DO UPDATE SET value_text = EXCLUDED.value_text`,
          [id, `Absender Zeile ${String(i)} — Muster GmbH & Co. KG`]
        );
      }
      if (i < REVIEW_PENDING_COUNT) {
        await pool.query(
          `INSERT INTO document_field_values (
             document_id, field_storage_key, value_text, confidence,
             value_text_norm, value_numeric, value_date
           ) VALUES ($1, 'suggestion:vendor', $2, 0.9, lower($2), NULL, NULL)
           ON CONFLICT (document_id, field_storage_key) DO UPDATE SET value_text = EXCLUDED.value_text`,
          [id, `Review queue vendor ${String(i)} — Fixture GmbH`]
        );
      }
      if (isShowcase && tagIds.length >= LONG_LABEL_NAMES.length) {
        for (let t = 0; t < LONG_LABEL_NAMES.length; t += 1) {
          await pool.query(
            `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ($1, $2, true)`,
            [id, tagIds[t]]
          );
        }
      } else if (i % 7 === 0 && i !== 0) {
        const tagId = tagIds[i % tagIds.length];
        await pool.query(
          `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ($1, $2, true)`,
          [id, tagId]
        );
      }
    }

    if (showcaseDocumentId && tagIds.length > 0) {
      await pool.query(
        `INSERT INTO document_tag_suggestions (document_id, tag_id, reason, dismissed, source, confidence)
         VALUES ($1, $2, 'perf-fixture', false, 'embedding', 0.92)`,
        [showcaseDocumentId, tagIds[0]]
      );
    }

    console.log(
      `Seeded user ${EMAIL}: ${String(DOC_COUNT)} documents, ${String(LABEL_COUNT)} labels, ${String(REVIEW_PENDING_COUNT)} review-queue items`
    );
  } finally {
    await pool.end();
  }
}

await main();
