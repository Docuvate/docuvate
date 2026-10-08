#!/usr/bin/env node
/**
 * Seeds a demo user for Labels KPI / landing screenshots.
 * Embeddings are orthogonal (Finanzen/Steuern/Vertrag axes) so assign suggestions
 * come from the real similarity pipeline, not hard-coded recommendations.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const pg = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const NAME = 'Labels Screenshots';

const DIM = 8;
function vec(values) {
  const out = Array.from({ length: DIM }, (_, i) => values[i] ?? 0);
  const norm = Math.hypot(...out) || 1;
  return out.map((v) => v / norm);
}

/** Unit axes for tag centroids; unlabeled docs use *Near* variants on the same axis. */
const V = {
  finanzen: vec([1, 0, 0, 0, 0, 0, 0, 0]),
  steuern: vec([0, 1, 0, 0, 0, 0, 0, 0]),
  vertrag: vec([0, 0, 1, 0, 0, 0, 0, 0]),
  nearFinanzen: vec([0.96, 0.04, 0, 0, 0, 0, 0, 0]),
  nearSteuern: vec([0.04, 0.96, 0, 0, 0, 0, 0, 0]),
  nearVertrag: vec([0, 0.04, 0.96, 0, 0, 0, 0, 0]),
  /** Posteingang: no strong assign to Finanzen/Steuern/Vertrag */
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
  const tagFinanzen = randomUUID();
  const tagSteuern = randomUUID();
  const tagVertrag = randomUUID();

  const tags = [
    [tagInbox, 'Posteingang', true, '#64748b', 'none', ''],
    [tagFinanzen, 'Finanzen', false, '#3b82f6', 'none', ''],
    [tagSteuern, 'Steuern', false, '#f59e0b', 'none', ''],
    [tagVertrag, 'Vertrag', false, '#8b5cf6', 'none', ''],
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
      title: 'Finanzplan Muster GmbH.pdf',
      filename: 'Finanzplan_Muster_GmbH.pdf',
      text: 'Finanzplanung und Liquiditätsübersicht Finanzen für Muster GmbH, Geschäftsjahr 2024.',
      tags: [tagFinanzen],
      embedding: V.finanzen,
    },
    {
      title: 'Steuerbescheid Muster 2023.pdf',
      filename: 'Steuerbescheid_Muster_2023.pdf',
      text: 'Steuerbescheid Einkommensteuer Steuern vom Finanzamt Musterstadt.',
      tags: [tagSteuern],
      embedding: V.steuern,
    },
    {
      title: 'Posteingang Scan.pdf',
      filename: 'Posteingang_Scan.pdf',
      text: 'Allgemeiner Posteingang ohne Zuordnung.',
      tags: [tagInbox],
      embedding: V.neutral,
    },
    {
      title: 'Kontoauszug März 2024.pdf',
      filename: 'Kontoauszug_Maerz_2024.pdf',
      text: 'Kontoauszug Umsätze und Saldo März 2024 Sparkasse Musterstadt.',
      tags: [],
      embedding: V.nearFinanzen,
    },
    {
      title: 'Lohnsteuerbescheinigung 2024.pdf',
      filename: 'Lohnsteuerbescheinigung_2024.pdf',
      text: 'Lohnsteuerbescheinigung für Muster Person, Steuern Arbeitgeber Nordstadt AG.',
      tags: [],
      embedding: V.nearSteuern,
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
        `INSERT INTO document_embeddings (document_id, user_id, model, embedding, updated_at)
         VALUES ($1, $2, 'seed', $3::jsonb, now())`,
        [id, userId, JSON.stringify(doc.embedding)]
      );
    }
    return id;
  }

  for (const doc of docs) {
    await insertDoc(doc);
  }

  const stackId = randomUUID();
  const vertragPrimary = await insertDoc({
    title: 'Mietvertrag Wohnung Musterstraße.pdf',
    filename: 'Mietvertrag_Wohnung_Musterstrasse.pdf',
    text: 'Mietvertrag Wohnraum Musterstraße 12, Laufzeit und Kündigung Vertrag.',
    tags: [tagVertrag],
    embedding: V.vertrag,
  });
  const vertragOldVersion = await insertDoc({
    title: 'Mietvertrag Wohnung Entwurf.pdf',
    filename: 'Mietvertrag_Wohnung_Entwurf.pdf',
    text: 'Mietvertrag ältere Fassung Wohnung Musterstraße Vertrag.',
    tags: [tagVertrag],
    embedding: V.nearVertrag,
  });
  await insertDoc({
    title: 'Mietvertrag Garage.pdf',
    filename: 'Mietvertrag_Garage.pdf',
    text: 'Mietvertrag Garagenstellplatz Hausverwaltung Musterstraße Vertrag.',
    tags: [],
    embedding: V.nearVertrag,
  });

  await pool.query(
    `INSERT INTO document_duplicate_stacks (id, user_id, created_at, updated_at)
     VALUES ($1, $2, now(), now())`,
    [stackId, userId]
  );
  await pool.query(
    `INSERT INTO document_stack_members (stack_id, document_id, user_id, role)
     VALUES ($1, $2, $3, 'primary'), ($1, $4, $3, 'version')`,
    [stackId, vertragPrimary, userId, vertragOldVersion]
  );

  const removedId = await insertDoc({
    title: 'Entwurf gelöscht.pdf',
    filename: 'Entwurf_geloescht.pdf',
    text: 'Entwurf wurde entfernt und zählt nicht in der Bibliothek.',
    tags: [],
    embedding: V.neutral,
  });
  await pool.query(`DELETE FROM documents WHERE id = $1`, [removedId]);

  const centroidRows = [
    [tagFinanzen, V.finanzen, 1],
    [tagSteuern, V.steuern, 1],
    [tagVertrag, V.vertrag, 2],
  ];
  for (const [tagId, centroid, sampleCount] of centroidRows) {
    await pool.query(
      `INSERT INTO tag_embedding_centroids (tag_id, user_id, model, sample_count, centroid, updated_at)
       VALUES ($1, $2, 'seed', $3, $4::jsonb, now())
       ON CONFLICT (tag_id) DO UPDATE SET centroid = $4::jsonb, sample_count = $3, updated_at = now()`,
      [tagId, userId, sampleCount, JSON.stringify(centroid)]
    );
  }

  await pool.query(
    `INSERT INTO user_preferences (user_id, label_near_similarity_threshold, updated_at)
     VALUES ($1, 0.62, now())
     ON CONFLICT (user_id) DO UPDATE SET label_near_similarity_threshold = 0.62, updated_at = now()`,
    [userId]
  );

  console.log(
    `Seeded ${docs.length + 2} library documents (+ version stack) for ${EMAIL} (user ${userId})`
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
