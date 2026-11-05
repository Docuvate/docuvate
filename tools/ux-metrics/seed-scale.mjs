#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Seeds a synthetic UX scale fixture (no real data): 300 long labels, 30 recognized fields,
 * nested folders and 3_000 documents with labels, suggestions and field values.
 * Usage: node tools/ux-metrics/seed-scale.mjs (needs a running API and Postgres).
 */
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const EMAIL = process.env.UX_FIXTURE_EMAIL ?? 'ux.scale@fixture.docuvate.test';
const PASSWORD = process.env.UX_FIXTURE_PASSWORD ?? 'UxScaleFixture1!';
const DOC_COUNT = Number(process.env.UX_FIXTURE_DOC_COUNT ?? '3000');
const LABEL_COUNT = Number(process.env.UX_FIXTURE_LABEL_COUNT ?? '300');
const FIELD_COUNT = Number(process.env.UX_FIXTURE_FIELD_COUNT ?? '30');

const LABEL_HEADS = [
  'Versicherung',
  'Steuer',
  'Mietvertrag',
  'Arbeitgeber',
  'Krankenkasse',
  'Bank',
  'Rechnung',
  'Kfz',
  'Rente',
  'Kita',
  'Handwerker',
  'Strom',
  'Telekommunikation',
  'Behörde',
  'Arzt',
];
const LABEL_TAILS = [
  'Nebenkostenabrechnung',
  'Beitragsanpassung',
  'Jahresbescheinigung',
  'Kündigungsbestätigung',
  'Zahlungserinnerung',
  'Vertragsänderung',
  'Leistungsabrechnung',
  'Lastschriftmandat',
  'Widerspruchsbescheid',
  'Kostenvoranschlag',
  'Abschlagszahlung',
  'Gutschrift',
  'Mahnung',
  'Selbstauskunft',
  'Antragsbestätigung',
  'Steuerbescheinigung',
  'Zinsmitteilung',
  'Wartungsprotokoll',
  'Einkommensnachweis',
  'Garantiebeleg',
];
const FIELD_TYPES = ['text', 'date', 'number', 'currency'];
const FIELD_NAMES = [
  'Absender',
  'Empfänger',
  'Rechnungsdatum',
  'Rechnungsnummer',
  'Betrag brutto',
  'Betrag netto',
  'Mehrwertsteuer',
  'IBAN',
  'Kundennummer',
  'Vertragsnummer',
  'Fälligkeitsdatum',
  'Versicherungsnummer',
  'Steuernummer',
  'Aktenzeichen',
  'Leistungszeitraum Beginn',
  'Leistungszeitraum Ende',
  'Zählernummer',
  'Verbrauch kWh',
  'Kennzeichen',
  'Policennummer',
  'Beitrag monatlich',
  'Selbstbeteiligung',
  'Zahlungsziel',
  'Mandatsreferenz',
  'Gläubiger-ID',
  'Bestellnummer',
  'Lieferdatum',
  'Ansprechpartner',
  'Telefonnummer Sachbearbeitung',
  'Bemerkung zur Zahlung',
];
const FOLDER_TOP = [
  'Finanzen',
  'Wohnen',
  'Gesundheit',
  'Arbeit',
  'Fahrzeuge',
  'Familie',
  'Behörden',
  'Archiv',
];
const FOLDER_MID = [
  '2022',
  '2023',
  '2024',
  '2025',
  'Laufende Verträge mit sehr langem Ordnernamen',
];
const FOLDER_LEAF = ['Eingang', 'Erledigt', 'Rückfragen offen'];

/** Deterministic PRNG so screenshots stay comparable between runs. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'Uxa Skalentest' }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`sign-up failed ${String(res.status)}: ${await res.text()}`);
  }
}

function fieldValue(type, i, rand) {
  if (type === 'date') {
    const d = new Date(Date.UTC(2022, 0, 1) + Math.floor(rand() * 1400) * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    return { text: iso, numeric: null, date: iso };
  }
  if (type === 'number' || type === 'currency') {
    const n = Math.round(rand() * 500_000) / 100;
    return { text: String(n), numeric: n, date: null };
  }
  const text = `Muster ${String(i % 97)} GmbH & Co. KG — Abteilung Forderungsmanagement Süd`;
  return { text, numeric: null, date: null };
}

async function main() {
  await ensureUser();
  const { createRequire } = await import('node:module');
  const { randomUUID } = await import('node:crypto');
  const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const rand = rng(42);
  try {
    const userId = (await pool.query(`SELECT id FROM "user" WHERE email = $1`, [EMAIL])).rows[0]
      ?.id;
    if (!userId) {
      throw new Error(`fixture user not found: ${EMAIL}`);
    }
    await pool.query(`DELETE FROM documents WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM tags WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM recognized_field_definitions WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM folders WHERE user_id = $1`, [userId]);

    const tagIds = [];
    for (let i = 0; i < LABEL_COUNT; i += 1) {
      const head = LABEL_HEADS[i % LABEL_HEADS.length];
      const tail = LABEL_TAILS[Math.floor(i / LABEL_HEADS.length) % LABEL_TAILS.length];
      const name =
        i % 9 === 0 ? `${head}-${tail}-Sonderfall-mit-Überlänge-${String(i)}` : `${head}-${tail}`;
      const id = randomUUID();
      tagIds.push(id);
      await pool.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox) VALUES ($1, $2, $3, $4, false)`,
        [id, userId, name, `hsl(${String((i * 37) % 360)} 60% 50%)`]
      );
    }

    const fields = [];
    for (let i = 0; i < FIELD_COUNT; i += 1) {
      const id = randomUUID();
      const type = i < 2 || i > 26 ? 'text' : FIELD_TYPES[i % FIELD_TYPES.length];
      const key = `ux_field_${String(i).padStart(2, '0')}`;
      fields.push({ id, key, type });
      await pool.query(
        `INSERT INTO recognized_field_definitions
           (id, user_id, field_key, label, field_type, sort_order, extract_for_all_documents, show_in_filter)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, userId, key, FIELD_NAMES[i % FIELD_NAMES.length], type, i, i < 6, i < 10]
      );
      const gateCount = i % 3 === 0 ? 0 : 1 + (i % 4);
      for (let g = 0; g < gateCount; g += 1) {
        await pool.query(
          `INSERT INTO recognized_field_definition_gate_labels (field_definition_id, tag_id) VALUES ($1, $2)`,
          [id, tagIds[(i * 11 + g * 7) % tagIds.length]]
        );
      }
    }

    const folderIds = [];
    for (const top of FOLDER_TOP) {
      const topId = randomUUID();
      folderIds.push(topId);
      await pool.query(`INSERT INTO folders (id, user_id, name) VALUES ($1, $2, $3)`, [
        topId,
        userId,
        top,
      ]);
      for (const mid of FOLDER_MID) {
        const midId = randomUUID();
        folderIds.push(midId);
        await pool.query(
          `INSERT INTO folders (id, user_id, name, parent_id) VALUES ($1, $2, $3, $4)`,
          [midId, userId, mid, topId]
        );
        for (const leaf of FOLDER_LEAF) {
          const leafId = randomUUID();
          folderIds.push(leafId);
          await pool.query(
            `INSERT INTO folders (id, user_id, name, parent_id) VALUES ($1, $2, $3, $4)`,
            [leafId, userId, leaf, midId]
          );
        }
      }
    }

    const now = Date.now();
    for (let i = 0; i < DOC_COUNT; i += 1) {
      const id = randomUUID();
      const at = new Date(now - i * 3_600_000);
      const status = i % 211 === 5 ? 'failed' : i % 157 === 3 ? 'processing' : 'ready';
      const title =
        i % 5 === 0
          ? `Sehr langer Dokumenttitel ${LABEL_TAILS[i % LABEL_TAILS.length]} ohne Umbruchmöglichkeit Nr. ${String(i)}`
          : `${LABEL_TAILS[i % LABEL_TAILS.length]} ${String(i)}`;
      const folderId = i % 4 === 0 ? null : folderIds[i % folderIds.length];
      await pool.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, folder_id,
           document_date, created_at, updated_at, file_size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6, 'application/pdf', $7, $8, $9, $9, $10)`,
        [
          id,
          userId,
          `scan-${String(i)}.pdf`,
          title,
          status,
          `ux-fixture/${id}`,
          folderId,
          at.toISOString().slice(0, 10),
          at,
          120_000 + i,
        ]
      );
      const tagCount = i % 10 === 0 ? 12 : Math.floor(rand() * 5);
      const used = new Set();
      for (let t = 0; t < tagCount; t += 1) {
        used.add(tagIds[Math.floor(rand() * tagIds.length)]);
      }
      for (const tagId of used) {
        await pool.query(
          `INSERT INTO document_tags (document_id, tag_id, user_confirmed) VALUES ($1, $2, $3)`,
          [id, tagId, rand() > 0.3]
        );
      }
      if (i % 6 === 0) {
        const tagId = tagIds[(i * 13) % tagIds.length];
        if (!used.has(tagId)) {
          await pool.query(
            `INSERT INTO document_tag_suggestions (document_id, tag_id, reason, source, confidence)
             VALUES ($1, $2, 'ux-fixture', 'embedding', $3)`,
            [id, tagId, 0.6 + rand() * 0.35]
          );
        }
      }
      for (const field of fields) {
        if (rand() > 0.35) {
          continue;
        }
        const v = fieldValue(field.type, i, rand);
        await pool.query(
          `INSERT INTO document_field_values
             (document_id, field_storage_key, value_text, confidence, value_text_norm, value_numeric, value_date)
           VALUES ($1, $2, $3, $4, lower($3), $5, $6)`,
          [
            id,
            `global:${field.key}`,
            v.text,
            rand() > 0.5 ? 1 : 0.4 + rand() * 0.5,
            v.numeric,
            v.date,
          ]
        );
      }
    }
    console.log(
      `Seeded ${EMAIL}: ${String(DOC_COUNT)} documents, ${String(LABEL_COUNT)} labels, ` +
        `${String(FIELD_COUNT)} fields, ${String(folderIds.length)} folders`
    );
  } finally {
    await pool.end();
  }
}

await main();
