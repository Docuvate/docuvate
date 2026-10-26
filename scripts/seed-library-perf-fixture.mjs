#!/usr/bin/env node
/**
 * Seeds the E2E smoke user with 5_000 documents and 300 labels for library perf tests.
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const DOC_COUNT = Number(process.env.LIBRARY_PERF_DOC_COUNT ?? '5000');
const LABEL_COUNT = Number(process.env.LIBRARY_PERF_LABEL_COUNT ?? '300');

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

    await pool.query(`DELETE FROM documents WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM tags WHERE user_id = $1`, [userId]);

    const tagIds = [];
    for (let i = 0; i < LABEL_COUNT; i += 1) {
      const id = randomUUID();
      tagIds.push(id);
      await pool.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox, created_at, updated_at)
         VALUES ($1, $2, $3, '#888888', false, now(), now())`,
        [id, userId, `perf-label-${String(i).padStart(4, '0')}`]
      );
    }

    const now = Date.now();
    for (let i = 0; i < DOC_COUNT; i += 1) {
      const id = randomUUID();
      const updatedAt = new Date(now - i * 1000);
      await pool.query(
        `INSERT INTO documents (
          id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at
        ) VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', $6, $6)`,
        [id, userId, `perf-${String(i)}.pdf`, `Perf document ${String(i)}`, `perf/${id}`, updatedAt]
      );
      if (i % 7 === 0) {
        const tagId = tagIds[i % tagIds.length];
        await pool.query(
          `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ($1, $2, true)`,
          [id, tagId]
        );
      }
    }

    console.log(
      `Seeded user ${EMAIL}: ${String(DOC_COUNT)} documents, ${String(LABEL_COUNT)} labels`
    );
  } finally {
    await pool.end();
  }
}

await main();
