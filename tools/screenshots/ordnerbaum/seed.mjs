#!/usr/bin/env node
/** Demo tree for ordnerbaum screenshots (EHW+, long names, sample documents). */
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const API = process.env.API_BASE ?? 'http://localhost:3001/v1';
const AUTH_ROOT = (process.env.AUTH_BASE ?? 'http://localhost:3001').replace(/\/$/, '');
const AUTH = AUTH_ROOT.endsWith('/api/auth') ? AUTH_ROOT : `${AUTH_ROOT}/api/auth`;
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const DEFAULT_SEED_EMAIL = 'ordner.demo@fixture.docuvate.test';
const SEED_EMAIL = process.env.SEED_EMAIL ?? DEFAULT_SEED_EMAIL;
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'screenshot-demo-12';

function assertFixtureAccountEmail(email) {
  if (!email.endsWith('@fixture.docuvate.test')) {
    throw new Error(`Refusing ordnerbaum seed for non-fixture email: ${email}`);
  }
}

assertFixtureAccountEmail(SEED_EMAIL);
const DEMO_DOC_COUNT = 12;
const PDF_LIB_PACKAGE = path.join(ROOT, 'e2e/package.json');
const SHOWCASE_TAG_NAMES = ['Finanzen', 'Vertrag', 'Steuern'];
const SHOWCASE_DOC_SPECS = [
  {
    title: 'Rechnung Büromaterial Q1',
    lines: ['Rechnung Büromaterial Q1 2026', 'Netto 428,50 EUR', 'Lieferant: Papierhaus Nord'],
  },
  {
    title: 'Mietvertrag Werkstatt',
    lines: ['Mietvertrag Gewerbeeinheit', 'Mieter: EHW+ Werkstatt GmbH', 'Beginn 01.04.2025'],
  },
  {
    title: 'Steuerbescheid 2024',
    lines: ['Einkommensteuerbescheid 2024', 'Finanzamt Musterstadt', 'Festsetzung 12.380 EUR'],
  },
  {
    title: 'Versicherungspolice Gebäude',
    lines: ['Gebäudeversicherung Objekt Hauptstraße', 'Police-Nr. GV-88421', 'Jahresprämie 2.940 EUR'],
  },
  {
    title: 'Lieferschein EHW+',
    lines: ['Lieferschein Ersatzteile Heizung', 'Positionen: 6', 'Empfänger: EHW+ Service'],
  },
  {
    title: 'Wartungsprotokoll Heizung',
    lines: ['Wartungsprotokoll Gasheizung', 'Techniker: Jonas Beispiel', 'Nächste Prüfung 10/2027'],
  },
  {
    title: 'Angebot Sanierung',
    lines: ['Angebot Dachsanierung Flachdach', 'Summe 18.600 EUR', 'Gültig bis 30.11.2026'],
  },
  {
    title: 'Protokoll Eigentümerversammlung',
    lines: ['Protokoll Eigentümerversammlung 2026', 'TOP 3: Instandhaltungsrücklage', 'Beschluss einstimmig'],
  },
  {
    title: 'Stromrechnung Dezember',
    lines: ['Stromabrechnung Dezember 2025', 'Verbrauch 3.420 kWh', 'Abschlag angepasst'],
  },
  {
    title: 'Vertrag Entsorgung',
    lines: ['Entsorgungsvertrag Restmüll', 'Leerung wöchentlich dienstags', 'Kündigung 3 Monate'],
  },
  {
    title: 'Gutschrift Lieferant',
    lines: ['Gutschrift zu Rechnung 8840', 'Betrag 126,00 EUR', 'Grund: Retoure Paletten'],
  },
  {
    title: 'Handwerkerrechnung Dach',
    lines: ['Rechnung Dachdecker Meier', 'Arbeiten Regenrinne', 'Brutto 1.904 EUR'],
  },
];
const DATABASE_URL = process.env.DATABASE_URL;

async function loadPdfLib() {
  const { createRequire } = await import('node:module');
  const require = createRequire(PDF_LIB_PACKAGE);
  return require('pdf-lib');
}

async function buildShowcasePdfBuffer(spec, index) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  const uniqueRef = randomBytes(8).toString('hex');
  let y = 780;
  for (const line of [
    spec.title,
    `Referenz ${index}-${uniqueRef}`,
    'Docuvate Ordnerbaum Showcase (Musterdaten).',
    ...spec.lines,
  ]) {
    page.drawText(line, { x: 48, y, size: 12, font, color: rgb(0.12, 0.12, 0.12) });
    y -= 20;
  }
  return Buffer.from(await doc.save());
}

async function withPg(fn) {
  if (!DATABASE_URL) return null;
  const { createRequire } = await import('node:module');
  const require = createRequire(path.join(ROOT, 'apps/api/package.json'));
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

async function userIdForEmail(email) {
  return withPg(async (pool) => {
    const userRow = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email]);
    return userRow.rows[0]?.id ?? null;
  });
}

async function purgeDocumentsForEmail(email) {
  const userId = await userIdForEmail(email);
  if (!userId) return;
  await withPg(async (pool) => {
    await pool.query(
      `DELETE FROM document_stack_members m
       USING document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $1`,
      [userId]
    );
    await pool.query('DELETE FROM document_duplicate_stacks WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  });
}

async function flattenDuplicateStacksForEmail(email) {
  const userId = await userIdForEmail(email);
  if (!userId) return;
  await withPg(async (pool) => {
    await pool.query('DELETE FROM document_duplicate_candidates WHERE user_id = $1', [userId]);
    await pool.query(
      `DELETE FROM document_stack_members m
       USING document_duplicate_stacks s
       WHERE m.stack_id = s.id AND s.user_id = $1`,
      [userId]
    );
    await pool.query('DELETE FROM document_duplicate_stacks WHERE user_id = $1', [userId]);
  });
}

async function folderDocumentStats(email, folderId) {
  const userId = await userIdForEmail(email);
  if (!userId) {
    return { total: 0, ready: 0, pending: 0, failed: 0 };
  }
  return withPg(async (pool) => {
    const row = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE status = 'ready')::int AS ready,
         count(*) FILTER (WHERE status IN ('uploaded', 'queued', 'extracting'))::int AS pending,
         count(*) FILTER (WHERE status = 'failed')::int AS failed
       FROM documents
       WHERE user_id = $1 AND folder_id = $2`,
      [userId, folderId]
    );
    const stats = row.rows[0] ?? {};
    return {
      total: stats.total ?? 0,
      ready: stats.ready ?? 0,
      pending: stats.pending ?? 0,
      failed: stats.failed ?? 0,
    };
  });
}

async function ensureSession() {
  if (process.env.COOKIE) {
    throw new Error('COOKIE env override is not allowed for ordnerbaum seed (use SEED_EMAIL fixture account only)');
  }
  const signInOnly = async () => {
    const signIn = await fetch(`${AUTH}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
      body: JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }),
    });
    const cookies = signIn.headers.getSetCookie?.() ?? [];
    if (signIn.ok && cookies.length > 0) {
      return cookies.map((c) => c.split(';')[0]).join('; ');
    }
    return null;
  };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const existing = await signInOnly();
    if (existing) return existing;
    await new Promise((r) => setTimeout(r, 300));
  }
  const signUp = await fetch(`${AUTH}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: WEB_ORIGIN },
    body: JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: 'Screenshot Demo',
    }),
  });
  const signUpCookies = signUp.headers.getSetCookie?.() ?? [];
  if (signUp.ok && signUpCookies.length > 0) {
    return signUpCookies.map((c) => c.split(';')[0]).join('; ');
  }
  if (signUp.ok || signUp.status === 422 || signUp.status === 403 || signUp.status === 429) {
    if (signUp.ok) {
      await new Promise((r) => setTimeout(r, 1500));
    }
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const retry = await signInOnly();
      if (retry) return retry;
      await new Promise((r) => setTimeout(r, signUp.status === 429 ? 1000 : 400));
    }
    throw new Error(`Auth failed: sign-in after sign-up (${signUp.status})`);
  }
  throw new Error(`Auth failed: sign-up ${signUp.status}`);
}

async function authed(cookie, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Cookie: cookie,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function deleteFolderById(cookie, folderId) {
  const res = await fetch(`${API}/folders/${folderId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  if (res.status === 404) return;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`/folders/${folderId} ${res.status}: ${JSON.stringify(body)}`);
  }
}

async function deleteAllFoldersInMappe(cookie, mappeId) {
  for (let pass = 0; pass < 30; pass += 1) {
    const folders = await authed(cookie, '/folders');
    const inMappe = (folders.items ?? []).filter((f) => f.mappeId === mappeId);
    if (inMappe.length === 0) break;
    const leaves = inMappe.filter((f) => !inMappe.some((other) => other.parentId === f.id));
    for (const folder of leaves) {
      await deleteFolderById(cookie, folder.id);
    }
  }
}

async function deleteAllUserDocuments(cookie) {
  for (let pass = 0; pass < 40; pass += 1) {
    const list = await authed(cookie, '/documents');
    const items = list.items ?? [];
    if (items.length === 0) return;
    for (const doc of items) {
      await authed(cookie, `/documents/${doc.id}`, { method: 'DELETE' });
    }
  }
  const left = await authed(cookie, '/documents');
  if ((left.items ?? []).length > 0) {
    throw new Error(`Could not purge documents (remaining ${left.items.length})`);
  }
}

async function deleteDocumentsInMappe(cookie, mappeId) {
  const folders = await authed(cookie, '/folders');
  const folderIds = (folders.items ?? []).filter((f) => f.mappeId === mappeId).map((f) => f.id);
  const seen = new Set();
  for (const folderId of folderIds) {
    const list = await authed(cookie, `/documents?folderId=${folderId}`);
    for (const doc of list.items ?? []) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      await authed(cookie, `/documents/${doc.id}`, { method: 'DELETE' });
    }
  }
  const mappeList = await authed(cookie, `/documents?mappeId=${mappeId}`);
  for (const doc of mappeList.items ?? []) {
    if (seen.has(doc.id)) continue;
    await authed(cookie, `/documents/${doc.id}`, { method: 'DELETE' });
  }
}

async function ensureShowcaseTags(cookie) {
  const existing = await authed(cookie, '/tags');
  const byName = new Map((existing.items ?? []).map((tag) => [tag.name, tag]));
  for (const name of SHOWCASE_TAG_NAMES) {
    if (byName.has(name)) continue;
    const created = await authed(cookie, '/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color: '#2563eb' }),
    });
    byName.set(name, created);
  }
  return [...byName.values()].filter((tag) => !tag.isInbox);
}

async function waitForVisibleFolderDocuments(cookie, folderId, minCount, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await flattenDuplicateStacksForEmail(SEED_EMAIL);
    const docs = (await authed(cookie, `/documents?folderId=${folderId}`)).items ?? [];
    if (
      docs.length >= minCount &&
      docs.every((d) => d.status === 'ready') &&
      docs.every((d) => !['uploaded', 'queued', 'extracting', 'failed'].includes(d.status))
    ) {
      return docs;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  const docs = (await authed(cookie, `/documents?folderId=${folderId}`)).items ?? [];
  throw new Error(
    `showcase docs not visible: listed=${docs.length}, statuses=${docs.map((d) => d.status).join(',')}`
  );
}

async function waitForShowcaseDocuments(cookie, folderId, minCount, timeoutMs = 600_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const stats = await folderDocumentStats(SEED_EMAIL, folderId);
    if (
      stats.total >= minCount &&
      stats.pending === 0 &&
      stats.failed === 0 &&
      stats.ready >= minCount
    ) {
      const docs = await waitForVisibleFolderDocuments(cookie, folderId, minCount);
      return { docs, readyCount: docs.length, failedCount: 0 };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  const stats = await folderDocumentStats(SEED_EMAIL, folderId);
  throw new Error(
    `showcase docs not ready: total=${stats.total}, ready=${stats.ready}, pending=${stats.pending}, failed=${stats.failed}`
  );
}

async function assignShowcaseLabels(cookie, docs, labelTags) {
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    if (doc.status !== 'ready') continue;
    const spec = SHOWCASE_DOC_SPECS[i % SHOWCASE_DOC_SPECS.length];
    const tagA = labelTags[i % labelTags.length];
    const tagB = labelTags[(i + 1) % labelTags.length];
    const tagIds =
      i % 3 === 0 && tagA && tagB && tagA.id !== tagB.id
        ? [tagA.id, tagB.id]
        : tagA
          ? [tagA.id]
          : undefined;
    await authed(cookie, `/documents/${doc.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: spec?.title ?? `Demo Dokument ${i + 1}`,
        ...(tagIds ? { tagIds } : {}),
      }),
    });
  }
}

async function seedDocumentsInFolder(cookie, { folderId, count }) {
  const before = await authed(cookie, '/documents');
  if ((before.items ?? []).length > 0) {
    throw new Error(`Refusing to seed: user still has ${before.items.length} document(s)`);
  }
  const labelTags = await ensureShowcaseTags(cookie);
  for (let i = 1; i <= count; i += 1) {
    const spec = SHOWCASE_DOC_SPECS[(i - 1) % SHOWCASE_DOC_SPECS.length];
    const payload = await buildShowcasePdfBuffer(spec, i);
    const safeName = `ordner-demo-${i}.pdf`;
    const form = new FormData();
    form.append('file', new Blob([payload], { type: 'application/pdf' }), safeName);
    const res = await fetch(`${API}/documents?folderId=${folderId}`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`upload ${i} ${res.status}: ${JSON.stringify(body)}`);
    }
    if (!body?.id) {
      throw new Error(`upload ${i} missing id: ${JSON.stringify(body)}`);
    }
  }
  const { docs } = await waitForShowcaseDocuments(cookie, folderId, count);
  await assignShowcaseLabels(cookie, docs, labelTags);
  const check = await authed(cookie, `/documents?folderId=${folderId}`);
  const listed = (check.items ?? []).length;
  if (listed < count) {
    throw new Error(
      `seedDocumentsInFolder: listed ${listed} after ${count} uploads (folderId=${folderId})`
    );
  }
}

async function findOrCreateFolder(cookie, { name, mappeId, parentId }) {
  const folders = await authed(cookie, '/folders');
  const pid = parentId ?? null;
  const found = (folders.items ?? []).find(
    (f) => f.name === name && f.mappeId === mappeId && (f.parentId ?? null) === pid
  );
  if (found) return found;
  return authed(cookie, '/folders', {
    method: 'POST',
    body: JSON.stringify({ name, mappeId, parentId: pid }),
  });
}

async function main() {
  await purgeDocumentsForEmail(SEED_EMAIL);
  const cookie = await ensureSession();
  await deleteAllUserDocuments(cookie);
  const mappen = await authed(cookie, '/mappen');
  let ehw = mappen.items?.find((m) => m.name === 'EHW+');
  if (!ehw) {
    ehw = await authed(cookie, '/mappen', { method: 'POST', body: JSON.stringify({ name: 'EHW+' }) });
  }

  await deleteDocumentsInMappe(cookie, ehw.id);
  await deleteAllFoldersInMappe(cookie, ehw.id);

  const direkt = await findOrCreateFolder(cookie, { name: 'Direkt', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, { name: 'Rechnungen', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, {
    name: 'Sehr langer Ordnername für Zeilenumbruch in der Seitenleiste',
    mappeId: ehw.id,
    parentId: null,
  });
  await findOrCreateFolder(cookie, { name: 'Archiv', mappeId: ehw.id, parentId: null });
  const vertraege = await findOrCreateFolder(cookie, { name: 'Verträge', mappeId: ehw.id, parentId: null });
  await findOrCreateFolder(cookie, { name: 'Unterlagen', mappeId: ehw.id, parentId: vertraege.id });

  await purgeDocumentsForEmail(SEED_EMAIL);
  await deleteAllUserDocuments(cookie);
  await seedDocumentsInFolder(cookie, {
    folderId: direkt.id,
    count: DEMO_DOC_COUNT,
  });
  const verifiedCount = (await authed(cookie, `/documents?folderId=${direkt.id}`)).items?.length ?? 0;

  const sessionToken = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('better-auth.session_token='));
  const authCookie = sessionToken ? sessionToken.split('=').slice(1).join('=') : cookie;

  console.log(
    JSON.stringify(
      {
        ehwMappeId: ehw.id,
        direktFolderId: direkt.id,
        documentCount: verifiedCount,
        authCookie,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
