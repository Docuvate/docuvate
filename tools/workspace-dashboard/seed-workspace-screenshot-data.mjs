#!/usr/bin/env node
/**
 * Seeds realistic library + dashboard data for workspace screenshots (dedicated user).
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const pg = require('pg');

const FIXTURE_DOMAIN = '@fixture.docuvate.test';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const email = process.env.SEED_EMAIL ?? `workspace-screenshots${FIXTURE_DOMAIN}`;
const password = process.env.SEED_PASSWORD ?? 'WorkspaceScreenshot1!';
const NAME = process.env.SEED_NAME ?? 'Workspace Screenshots';

function assertSafeTarget() {
  if (!email.endsWith(FIXTURE_DOMAIN)) {
    throw new Error(`SEED_EMAIL must use ${FIXTURE_DOMAIN}`);
  }
  let host;
  try {
    host = new URL(DATABASE_URL.replace(/^postgres(ql)?:/, 'http:')).hostname;
  } catch {
    throw new Error('Invalid DATABASE_URL');
  }
  const allowed = new Set(['127.0.0.1', 'localhost', '::1']);
  if (!allowed.has(host)) {
    throw new Error(`DATABASE_URL host must be local (${host})`);
  }
}

assertSafeTarget();

async function ensureUser() {
  const headers = { 'content-type': 'application/json', origin: WEB_ORIGIN };
  const signIn = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (signIn.ok) {
    return;
  }
  const signUp = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, name: NAME }),
  });
  if (!signUp.ok && signUp.status !== 422) {
    throw new Error(`sign-up failed ${signUp.status}: ${await signUp.text()}`);
  }
}

async function seed(pool, userId) {
  await pool.query(
    'DELETE FROM saved_document_view_tags WHERE view_id IN (SELECT id FROM saved_document_views WHERE owner_user_id = $1)',
    [userId]
  );
  await pool.query('DELETE FROM saved_document_views WHERE owner_user_id = $1', [userId]);
  await pool.query('DELETE FROM dashboard_widgets WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM document_tags WHERE document_id IN (SELECT id FROM documents WHERE user_id = $1)', [userId]);
  await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM tags WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM correspondents WHERE user_id = $1', [userId]);

  const tagDefs = [
    ['Rechnung', '#c41e3a'],
    ['Vertrag', '#8b5cf6'],
    ['Versicherung', '#0d9488'],
  ];
  const tagIds = {};
  for (const [name, color] of tagDefs) {
    const id = randomUUID();
    tagIds[name] = id;
    await pool.query(
      `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
       VALUES ($1, $2, $3, $4, false, 'none', '')`,
      [id, userId, name, color]
    );
  }

  const corrDefs = [
    ['Stadtwerke Musterstadt GmbH'],
    ['Allianz Versicherung AG'],
    ['Müller & Partner Steuerberatung'],
  ];
  const corrIds = {};
  for (const [name] of corrDefs) {
    const id = randomUUID();
    corrIds[name] = id;
    await pool.query(
      `INSERT INTO correspondents (id, user_id, name, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())`,
      [id, userId, name]
    );
  }

  const docTemplates = [
    { title: 'Stromrechnung Januar 2026.pdf', label: 'Rechnung', corr: 'Stadtwerke Musterstadt GmbH', date: '2026-01-15' },
    { title: 'Stromrechnung Februar 2026.pdf', label: 'Rechnung', corr: 'Stadtwerke Musterstadt GmbH', date: '2026-02-14' },
    { title: 'Haftpflicht Police 2026.pdf', label: 'Versicherung', corr: 'Allianz Versicherung AG', date: '2026-01-08' },
    { title: 'Mietvertrag Wohnung Musterstraße.pdf', label: 'Vertrag', corr: null, date: '2025-11-01' },
    { title: 'Steuerbescheid 2024.pdf', label: 'Rechnung', corr: 'Müller & Partner Steuerberatung', date: '2026-03-02' },
    { title: 'Kontoauszug März 2026.pdf', label: 'Rechnung', corr: null, date: '2026-03-31' },
    { title: 'Handyvertrag Verlängerung.pdf', label: 'Vertrag', corr: 'Stadtwerke Musterstadt GmbH', date: '2026-02-20' },
    { title: 'Kfz-Versicherung 2026.pdf', label: 'Versicherung', corr: 'Allianz Versicherung AG', date: '2026-01-02' },
    { title: 'Gehaltsabrechnung März 2026.pdf', label: 'Rechnung', corr: null, date: '2026-03-25' },
    { title: 'Wartungsvertrag Heizung.pdf', label: 'Vertrag', corr: 'Stadtwerke Musterstadt GmbH', date: '2025-12-10' },
    { title: 'Internetrechnung Q1 2026.pdf', label: 'Rechnung', corr: null, date: '2026-03-05' },
    { title: 'Berufsunfähigkeit Zusatz.pdf', label: 'Versicherung', corr: 'Allianz Versicherung AG', date: '2026-02-01' },
    { title: 'Mietnebenkostenabrechnung 2025.pdf', label: 'Rechnung', corr: null, date: '2026-02-28' },
    { title: 'Arbeitsvertrag Anpassung.pdf', label: 'Vertrag', corr: null, date: '2026-01-20' },
    { title: 'Krankenversicherung Beitrag.pdf', label: 'Versicherung', corr: 'Allianz Versicherung AG', date: '2026-03-10' },
    { title: 'Gartenhaus Rechnung.pdf', label: 'Rechnung', corr: null, date: '2026-02-18' },
    { title: 'Schornsteinfeger Rechnung 2026.pdf', label: 'Rechnung', corr: 'Stadtwerke Musterstadt GmbH', date: '2026-03-12' },
    { title: 'Vereinsbeitrag 2026.pdf', label: 'Vertrag', corr: null, date: '2026-01-05' },
    { title: 'Posteingang Scan ohne Label.pdf', label: null, corr: null, date: '2026-03-18' },
    { title: 'Foto-Notiz ohne Zuordnung.pdf', label: null, corr: null, date: '2026-03-20' },
    { title: 'Kassenbon ohne Label.pdf', label: null, corr: null, date: '2026-03-22' },
  ];

  for (const doc of docTemplates) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO documents (
         id, user_id, filename, mime_type, storage_key, status, extracted_text, title,
         document_date, correspondent_id, updated_at
       ) VALUES ($1, $2, $3, 'application/pdf', $4, 'ready', $5, $6, $7::date, $8, now())`,
      [
        id,
        userId,
        doc.title,
        `seed/${id}.pdf`,
        `Verarbeiteter Text für ${doc.title}`,
        doc.title,
        doc.date,
        doc.corr ? corrIds[doc.corr] : null,
      ]
    );
    if (doc.label) {
      await pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [
        id,
        tagIds[doc.label],
      ]);
    }
  }

  const views = [
    {
      name: 'Rechnungen 2026',
      tag: 'Rechnung',
      pinned: true,
      visibility: 'private',
      pos: 0,
    },
    {
      name: 'Ohne Label',
      withoutNonInboxLabel: true,
      pinned: true,
      visibility: 'private',
      pos: 1,
    },
    {
      name: 'Verträge',
      tag: 'Vertrag',
      pinned: false,
      visibility: 'private',
      pos: 2,
    },
  ];

  const viewIds = {};
  for (const v of views) {
    const id = randomUUID();
    viewIds[v.name] = id;
    await pool.query(
      `INSERT INTO saved_document_views (
         id, owner_user_id, name, visibility, position, pinned_sidebar,
         search_query, sort_field, sort_order, view_mode, filter_mode, list_scope,
         status_filter, inbox_filter, without_non_inbox_label, visible_columns
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         '', 'documentDate', 'desc', 'klassisch', 'ui', 'all',
         'ready', false, $7, '["title","labels","date","status"]'::jsonb
       )`,
      [id, userId, v.name, v.visibility, v.pos, v.pinned, v.withoutNonInboxLabel ?? false]
    );
    if (v.tag) {
      await pool.query(`INSERT INTO saved_document_view_tags (view_id, tag_id) VALUES ($1, $2)`, [
        id,
        tagIds[v.tag],
      ]);
    }
  }

  const widgetDefs = [
    { type: 'upload', position: 0, widthCols: 6, heightRows: 2 },
    { type: 'statistics', position: 1, widthCols: 4, heightRows: 2 },
  ];
  for (const w of widgetDefs) {
    await pool.query(
      `INSERT INTO dashboard_widgets (
         id, user_id, widget_type, position, width_cols, height_rows, saved_view_id, item_limit, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, now(), now())`,
      [randomUUID(), userId, w.type, w.position, w.widthCols, w.heightRows]
    );
  }
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
await ensureUser();
const userRes = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email]);
const userId = userRes.rows[0]?.id;
if (!userId) throw new Error('user not found');
await seed(pool, userId);
await pool.end();
console.log(`Workspace screenshot seed OK (${email})`);
