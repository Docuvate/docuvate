#!/usr/bin/env node
/**
 * Neutral demo data for README screenshots (fictional names, no real PII).
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const pg = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const EMAIL = process.env.SEED_EMAIL ?? 'readme-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'ReadmeScreenshot1!';
const NAME = 'Readme Screenshots';

const DIM = 8;
function vec(values) {
  const out = Array.from({ length: DIM }, (_, i) => values[i] ?? 0);
  const norm = Math.hypot(...out) || 1;
  return out.map((v) => v / norm);
}

const V = {
  finance: vec([1, 0, 0, 0, 0, 0, 0, 0]),
  tax: vec([0, 1, 0, 0, 0, 0, 0, 0]),
  contract: vec([0, 0, 1, 0, 0, 0, 0, 0]),
  nearFinance: vec([0.96, 0.04, 0, 0, 0, 0, 0, 0]),
  nearTax: vec([0.04, 0.96, 0, 0, 0, 0, 0, 0]),
  nearContract: vec([0, 0.04, 0.96, 0, 0, 0, 0, 0]),
  neutral: vec([0, 0, 0, 0, 1, 0, 0, 0]),
};

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
  });
  if (res.ok || res.status === 422) {
    return;
  }
  const text = await res.text();
  throw new Error(`sign-up failed ${res.status}: ${text}`);
}

async function seedData(pool, userId) {
  await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM tags WHERE user_id = $1', [userId]);

  const tagInbox = randomUUID();
  const tagFinance = randomUUID();
  const tagTax = randomUUID();
  const tagContract = randomUUID();

  const tags = [
    [tagInbox, 'Inbox', true, '#64748b', 'none', ''],
    [tagFinance, 'Finance', false, '#3b82f6', 'none', ''],
    [tagTax, 'Tax', false, '#f59e0b', 'none', ''],
    [tagContract, 'Contract', false, '#8b5cf6', 'none', ''],
  ];
  for (const [id, name, isInbox, color, algo, match] of tags) {
    await pool.query(
      `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, name, color, isInbox, algo, match]
    );
  }

  const docs = [
    {
      title: 'Annual budget overview.pdf',
      filename: 'annual_budget_overview.pdf',
      text: 'Budget and liquidity summary for Sample Industries Ltd., fiscal year 2024.',
      tags: [tagFinance],
      embedding: V.finance,
    },
    {
      title: 'Tax assessment 2023.pdf',
      filename: 'tax_assessment_2023.pdf',
      text: 'Income tax assessment for Sample City revenue office.',
      tags: [tagTax],
      embedding: V.tax,
    },
    {
      title: 'Scanned mail batch.pdf',
      filename: 'scanned_mail_batch.pdf',
      text: 'General inbox scan without classification.',
      tags: [tagInbox],
      embedding: V.neutral,
    },
    {
      title: 'Bank statement March 2024.pdf',
      filename: 'bank_statement_march_2024.pdf',
      text: 'Account transactions and balance for March 2024.',
      tags: [],
      embedding: V.nearFinance,
    },
    {
      title: 'Payroll tax certificate 2024.pdf',
      filename: 'payroll_tax_certificate_2024.pdf',
      text: 'Employer payroll tax certificate for a sample employee.',
      tags: [],
      embedding: V.nearTax,
    },
  ];

  async function insertDoc(doc, status = 'ready') {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO documents (
         id, user_id, filename, mime_type, storage_key, status, extracted_text, title, updated_at
       ) VALUES ($1, $2, $3, 'application/pdf', $4, $5, $6, $7, now())`,
      [id, userId, doc.filename, `seed/${id}.pdf`, status, doc.text, doc.title]
    );
    for (const tagId of doc.tags) {
      await pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [
        id,
        tagId,
      ]);
    }
    if (status === 'ready') {
      await pool.query(
        `INSERT INTO document_embeddings (document_id, model, embedding, updated_at)
         VALUES ($1, 'seed', $2::jsonb, now())`,
        [id, JSON.stringify(doc.embedding)]
      );
    }
    return id;
  }

  const docIds = [];
  for (const doc of docs) {
    docIds.push(await insertDoc(doc));
  }

  const detailDocId = await insertDoc({
    title: 'Office lease agreement.pdf',
    filename: 'office_lease_agreement.pdf',
    text: 'Commercial lease for Sample Street 12. Term, rent, and notice periods.',
    tags: [tagContract],
    embedding: V.contract,
  });

  await pool.query(
    `INSERT INTO user_preferences (user_id, label_near_similarity_threshold, updated_at)
     VALUES ($1, 0.62, now())
     ON CONFLICT (user_id) DO UPDATE SET label_near_similarity_threshold = 0.62, updated_at = now()`,
    [userId]
  );

  console.log(
    JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      detailDocumentId: detailDocId,
      libraryDocumentIds: docIds,
    })
  );
}

async function main() {
  await ensureUser();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const userRes = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [EMAIL]);
  const userId = userRes.rows[0]?.id;
  if (!userId) {
    throw new Error(`User not found after sign-up: ${EMAIL}`);
  }
  await seedData(pool, userId);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
