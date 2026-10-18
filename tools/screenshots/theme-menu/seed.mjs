#!/usr/bin/env node
/**
 * Demo user + library rows for theme-menu screenshots (neutral persona).
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../../../apps/api/package.json', import.meta.url));
const pg = require('pg');

export const THEME_MENU_EMAIL =
  process.env.THEME_MENU_EMAIL ?? 'elena.kraemer@beispiel.de';
export const THEME_MENU_PASSWORD =
  process.env.THEME_MENU_PASSWORD ?? 'ElenaKrämer2026!';
export const THEME_MENU_NAME = process.env.THEME_MENU_NAME ?? 'Elena Krämer';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({
      email: THEME_MENU_EMAIL,
      password: THEME_MENU_PASSWORD,
      name: THEME_MENU_NAME,
    }),
  });
  if (res.ok || res.status === 422) {
    return;
  }
  throw new Error(`sign-up failed ${res.status}: ${await res.text()}`);
}

export async function seedThemeMenuLibrary() {
  await ensureUser();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    const userRes = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [
      THEME_MENU_EMAIL,
    ]);
    const userId = userRes.rows[0]?.id;
    if (!userId) {
      throw new Error('theme menu user missing after sign-up');
    }

    await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);

    const samples = [
      ['Rechnung_Stadtwerke_März.pdf', 'Rechnung Stadtwerke März'],
      ['Versicherung_Hausrat_2026.pdf', 'Versicherung Hausrat 2026'],
      ['Kontoauszug_Februar.pdf', 'Kontoauszug Februar'],
      ['Mietvertrag_Wohnung.pdf', 'Mietvertrag Wohnung'],
    ];
    for (const [filename, title] of samples) {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO documents (
           id, user_id, filename, mime_type, storage_key, status, title, updated_at
         ) VALUES ($1, $2, $3, 'application/pdf', $4, 'ready', $5, now())`,
        [id, userId, filename, `theme-menu/${id}.pdf`, title]
      );
    }
    return userId;
  } finally {
    await pool.end();
  }
}
