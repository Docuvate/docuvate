#!/usr/bin/env node
/**
 * Seeds a demo user for Labels KPI / landing screenshots.
 * Embeddings are orthogonal (Finanzen/Steuern/Vertrag axes) so assign suggestions
 * come from the real similarity pipeline, not hard-coded recommendations.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const pg = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const EMAIL = process.env.SEED_EMAIL ?? 'labels-screenshots@docuvate.local';
const PASSWORD = process.env.SEED_PASSWORD ?? 'LabelsScreenshot1!';
const NAME = 'Labels Screenshots';
const MANIFEST_PATH =
  process.env.SEED_MANIFEST_PATH ??
  path.join(os.tmpdir(), 'docuvate-labels-screenshots', 'seed-manifest.json');

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

const GROUPED_SUGGESTION_REASON =
  'Mehrere Kontoauszüge und Finanzbelege passen zum Label Finanzen (Embedding).';

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

async function insertTagSuggestion(pool, documentId, tagId, reason, confidence = 0.78) {
  await pool.query(
    `INSERT INTO document_tag_suggestions (
       document_id, tag_id, reason, dismissed, source, confidence, decision_tier
     ) VALUES ($1, $2, $3, false, 'embedding', $4, 'near')
     ON CONFLICT (document_id, tag_id) DO UPDATE SET
       reason = EXCLUDED.reason,
       dismissed = false,
       source = EXCLUDED.source,
       confidence = EXCLUDED.confidence,
       decision_tier = EXCLUDED.decision_tier`,
    [documentId, tagId, reason, confidence]
  );
}

async function insertFieldValue(pool, documentId, fieldStorageKey, valueText, confidence) {
  await pool.query(
    `INSERT INTO document_field_values (
       document_id, field_storage_key, value_text, confidence,
       value_text_norm, value_numeric, value_date
     ) VALUES ($1, $2, $3, $4, $5, NULL, NULL)
     ON CONFLICT (document_id, field_storage_key) DO UPDATE SET
       value_text = EXCLUDED.value_text,
       confidence = EXCLUDED.confidence,
       value_text_norm = EXCLUDED.value_text_norm`,
    [documentId, fieldStorageKey, valueText, confidence, valueText.toLowerCase()]
  );
}

async function insertSavedView(pool, userId, row) {
  const {
    id,
    name,
    description,
    searchQuery = '',
    tagIds = [],
    pinnedSidebar = false,
    position,
  } = row;
  await pool.query(
    `INSERT INTO saved_document_views (
       id, owner_user_id, name, description, visibility, search_query, sort_field, sort_order,
       view_mode, filter_mode, list_scope, folder_id, correspondent_id,
       status_filter, inbox_filter, without_non_inbox_label, document_date_from, document_date_to,
       pinned_sidebar, position, visible_columns
     ) VALUES (
       $1, $2, $3, $4, 'private', $5, 'updatedAt', 'desc',
       'klassisch', 'ui', 'all', NULL, NULL,
       NULL, NULL, NULL, NULL, NULL,
       $6, $7, '["title","labels","date","status"]'::jsonb
     )`,
    [id, userId, name, description, searchQuery, pinnedSidebar, position]
  );
  for (const tagId of tagIds) {
    await pool.query(
      `INSERT INTO saved_document_view_tags (view_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, tagId]
    );
  }
}

async function seedData(pool, userId) {
  await pool.query(`DELETE FROM saved_document_views WHERE owner_user_id = $1`, [userId]);
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
      fileSizeBytes: 892_416,
    },
    {
      title: 'Steuerbescheid Muster 2023.pdf',
      filename: 'Steuerbescheid_Muster_2023.pdf',
      text: 'Steuerbescheid Einkommensteuer Steuern vom Finanzamt Musterstadt.',
      tags: [tagSteuern],
      embedding: V.steuern,
      fileSizeBytes: 524_288,
    },
    {
      title: 'Posteingang Scan.pdf',
      filename: 'Posteingang_Scan.pdf',
      text: 'Allgemeiner Posteingang ohne Zuordnung.',
      tags: [tagInbox],
      embedding: V.neutral,
      fileSizeBytes: 118_784,
    },
    {
      title: 'Beispiel-Kontoauszug-2024-03.pdf',
      filename: 'Beispiel_Kontoauszug_2024_03.pdf',
      text: 'Kontoauszug Umsätze und Saldo März 2024 Sparkasse Musterstadt.',
      tags: [],
      embedding: V.nearFinanzen,
      fileSizeBytes: 356_352,
    },
    {
      title: 'Beispiel-Steuerbescheinigung-2024.pdf',
      filename: 'Beispiel_Steuerbescheinigung_2024.pdf',
      text: 'Steuerbescheinigung für Alex Beispiel, Arbeitgeber Muster Nord AG.',
      tags: [],
      embedding: V.nearSteuern,
      fileSizeBytes: 401_408,
    },
    {
      title: 'Beispiel-Gebührenrechnung-Q1.pdf',
      filename: 'Beispiel_Gebuehrenrechnung_Q1.pdf',
      text: 'Gebührenrechnung Q1 Kontoführung und Zinsen Finanzen Sparkasse.',
      tags: [],
      embedding: V.nearFinanzen,
      fileSizeBytes: 287_232,
    },
    {
      title: 'Beispiel-Jahresabschluss-Entwurf.pdf',
      filename: 'Beispiel_Jahresabschluss_Entwurf.pdf',
      text: 'Jahresabschluss Entwurf Bilanz GuV Finanzen Muster GmbH.',
      tags: [],
      embedding: V.nearFinanzen,
      fileSizeBytes: 1_048_576,
    },
  ];

  async function insertDoc(doc, status = 'ready') {
    const id = randomUUID();
    const fileSizeBytes = doc.fileSizeBytes ?? 512_000;
    await pool.query(
      `INSERT INTO documents (
         id, user_id, filename, mime_type, file_size_bytes, storage_key, status, extracted_text, title,
         document_date, updated_at
       ) VALUES ($1, $2, $3, 'application/pdf', $4, $5, $6, $7, $8, $9::date, now())`,
      [
        id,
        userId,
        doc.filename,
        fileSizeBytes,
        `seed/${id}.pdf`,
        status,
        doc.text,
        doc.title,
        doc.documentDate ?? null,
      ]
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

  const insertedDocIds = [];
  for (const doc of docs) {
    insertedDocIds.push(await insertDoc(doc));
  }

  const groupedSuggestionDocIds = insertedDocIds.slice(3, 6);
  for (const documentId of groupedSuggestionDocIds) {
    await insertTagSuggestion(pool, documentId, tagFinanzen, GROUPED_SUGGESTION_REASON, 0.81);
  }
  await insertTagSuggestion(
    pool,
    insertedDocIds[6],
    tagFinanzen,
    GROUPED_SUGGESTION_REASON,
    0.79
  );

  const detailDocId = await insertDoc({
    title: 'Screenshot Feldwerte Demo.pdf',
    filename: 'Screenshot_Feldwerte_Demo.pdf',
    text: 'Rechnung Muster Nord AG mit Betrag und Rechnungsdatum für PR-I Screenshots.',
    tags: [tagFinanzen],
    embedding: V.finanzen,
    fileSizeBytes: 1_843_200,
    documentDate: '2024-03-15',
  });
  await insertFieldValue(pool, detailDocId, 'invoice_number', 'RE-2024-0842', 0.92);
  await insertFieldValue(pool, detailDocId, 'invoice_amount', '1.284,50 EUR', 0.71);
  await insertFieldValue(pool, detailDocId, 'invoice_date', '2024-03-15', 0.68);

  const stackId = randomUUID();
  const vertragPrimary = await insertDoc({
    title: 'Mietvertrag Wohnung Musterstraße.pdf',
    filename: 'Mietvertrag_Wohnung_Musterstrasse.pdf',
    text: 'Mietvertrag Wohnraum Musterstraße 12, Laufzeit und Kündigung Vertrag.',
    tags: [tagVertrag],
    embedding: V.vertrag,
    fileSizeBytes: 655_360,
  });
  const vertragOldVersion = await insertDoc({
    title: 'Mietvertrag Wohnung Entwurf.pdf',
    filename: 'Mietvertrag_Wohnung_Entwurf.pdf',
    text: 'Mietvertrag ältere Fassung Wohnung Musterstraße Vertrag.',
    tags: [tagVertrag],
    embedding: V.nearVertrag,
    fileSizeBytes: 622_592,
  });
  await insertDoc({
    title: 'Mietvertrag Garage.pdf',
    filename: 'Mietvertrag_Garage.pdf',
    text: 'Mietvertrag Garagenstellplatz Hausverwaltung Musterstraße Vertrag.',
    tags: [],
    embedding: V.nearVertrag,
    fileSizeBytes: 440_320,
  });

  await pool.query(
    `INSERT INTO document_duplicate_stacks (id, user_id, created_at, updated_at)
     VALUES ($1, $2, now(), now())`,
    [stackId, userId]
  );
  await pool.query(
    `INSERT INTO document_stack_members (stack_id, document_id, role)
     VALUES ($1, $2, 'primary'), ($1, $3, 'version')`,
    [stackId, vertragPrimary, vertragOldVersion]
  );

  const removedId = await insertDoc({
    title: 'Entwurf gelöscht.pdf',
    filename: 'Entwurf_geloescht.pdf',
    text: 'Entwurf wurde entfernt und zählt nicht in der Bibliothek.',
    tags: [],
    embedding: V.neutral,
    fileSizeBytes: 98_304,
  });
  await pool.query(`DELETE FROM documents WHERE id = $1`, [removedId]);

  const viewFinanzen = randomUUID();
  const viewSteuern = randomUUID();
  const viewInbox = randomUUID();
  await insertSavedView(pool, userId, {
    id: viewFinanzen,
    name: 'Finanzen — Monatsreport',
    description: 'Alle Dokumente mit Label Finanzen für den Monatsreport und Controlling.',
    tagIds: [tagFinanzen],
    pinnedSidebar: true,
    position: 0,
  });
  await insertSavedView(pool, userId, {
    id: viewSteuern,
    name: 'Steuerunterlagen 2024',
    description: 'Steuerbescheide und Bescheinigungen mit Label Steuern.',
    tagIds: [tagSteuern],
    pinnedSidebar: false,
    position: 1,
  });
  await insertSavedView(pool, userId, {
    id: viewInbox,
    name: 'Posteingang offen',
    description: 'Dokumente im Posteingang ohne weiteres Label.',
    tagIds: [tagInbox],
    pinnedSidebar: false,
    position: 2,
  });

  const centroidRows = [
    [tagFinanzen, V.finanzen, 1],
    [tagSteuern, V.steuern, 1],
    [tagVertrag, V.vertrag, 2],
  ];
  for (const [tagId, centroid, sampleCount] of centroidRows) {
    await pool.query(
      `INSERT INTO tag_embedding_centroids (tag_id, model, sample_count, centroid, updated_at)
       VALUES ($1, 'seed', $2, $3::jsonb, now())
       ON CONFLICT (tag_id) DO UPDATE SET centroid = $3::jsonb, sample_count = $2, updated_at = now()`,
      [tagId, sampleCount, JSON.stringify(centroid)]
    );
  }

  await pool.query(
    `INSERT INTO user_preferences (user_id, label_near_similarity_threshold, updated_at)
     VALUES ($1, 0.62, now())
     ON CONFLICT (user_id) DO UPDATE SET label_near_similarity_threshold = 0.62, updated_at = now()`,
    [userId]
  );

  const manifest = {
    email: EMAIL,
    documentDetailId: detailDocId,
    groupedSuggestionTagId: tagFinanzen,
    groupedSuggestionDocumentIds: [...groupedSuggestionDocIds, insertedDocIds[6]],
    savedViewIds: [viewFinanzen, viewSteuern, viewInbox],
  };
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `Seeded ${docs.length + 3} library documents (+ detail + version stack) for ${EMAIL} (user ${userId})`
  );
  console.log(`Wrote screenshot seed manifest to ${MANIFEST_PATH}`);
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
