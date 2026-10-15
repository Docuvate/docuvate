// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import pg from 'pg';

const LAB_EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
  const userRow = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(email) = lower($1) LIMIT 1`,
    [LAB_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error('lab user not found');
  }
  const before = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM document_tag_suggestions s
     JOIN documents d ON d.id = s.document_id
     WHERE d.user_id = $1 AND NOT s.dismissed`,
    [userId]
  );
  await pool.query(
    `DELETE FROM document_tag_suggestions s
     USING documents d
     WHERE d.id = s.document_id
       AND d.user_id = $1
       AND (
         (s.source = 'embedding' AND s.reason LIKE 'Embedding-Ähnlichkeit%')
         OR (
           s.source = 'embedding_density'
           AND coalesce(s.decision_tier, 'none') NOT IN ('confirm', 'auto_apply')
         )
       )`,
    [userId]
  );
  const after = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM document_tag_suggestions s
     JOIN documents d ON d.id = s.document_id
     WHERE d.user_id = $1 AND NOT s.dismissed`,
    [userId]
  );
  console.log(
    JSON.stringify(
      {
        open_suggestions_before: Number(before.rows[0]?.count ?? 0),
        open_suggestions_after: Number(after.rows[0]?.count ?? 0),
      },
      null,
      2
    )
  );
  await pool.end();
}

void main();
