#!/usr/bin/env node
/**
 * Landing-page Ordnerbaum seed (neutral names, populated folders).
 * PR/test tree (EHW+, long names): scripts/seed-ordnerbaum-screenshots.mjs
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const pg = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate';
const AUTH_BASE = process.env.AUTH_BASE ?? 'http://127.0.0.1:3001/api/auth';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const LOCALE = process.env.LOCALE === 'en' ? 'en' : 'de';

const EMAIL = process.env.FOLDERS_MARKETING_EMAIL ?? 'folders-marketing@docuvate.local';
const PASSWORD = process.env.FOLDERS_MARKETING_PASSWORD ?? 'FoldersMarketing1!';
const NAME = 'Folders Marketing';

const COPY = {
  de: {
    mappe: 'Privat',
    folders: {
      haushalt: 'Haushalt',
      steuern: 'Steuern 2025',
      vertraege: 'Verträge',
      versicherungen: 'Versicherungen',
      fahrzeug: 'Fahrzeug',
      arbeit: 'Arbeit',
    },
    tags: {
      rechnung: 'Rechnung',
      vertrag: 'Vertrag',
      versicherung: 'Versicherung',
      steuer: 'Steuer',
    },
  },
  en: {
    mappe: 'Personal',
    folders: {
      haushalt: 'Household',
      steuern: 'Taxes 2025',
      vertraege: 'Contracts',
      versicherungen: 'Insurance',
      fahrzeug: 'Vehicle',
      arbeit: 'Work',
    },
    tags: {
      rechnung: 'Invoice',
      vertrag: 'Contract',
      versicherung: 'Insurance',
      steuer: 'Tax',
    },
  },
};

const FOCUS_DOCS = {
  de: [
    { title: 'Stromabrechnung Q1 2025', date: '2025-02-12', tag: 'rechnung' },
    { title: 'Hausratversicherung Police', date: '2025-01-08', tag: 'versicherung' },
    { title: 'IKEA Rechnung Wohnzimmer', date: '2024-11-20', tag: 'rechnung' },
    { title: 'Handwerkerquittung Bad', date: '2024-10-03', tag: 'rechnung' },
    { title: 'Grundsteuerbescheid', date: '2025-03-01', tag: 'steuer' },
    { title: 'Nebenkostenabrechnung 2024', date: '2025-02-28', tag: 'rechnung' },
    { title: 'Glasfaser Vertrag', date: '2024-09-15', tag: 'vertrag' },
  ],
  en: [
    { title: 'Electric bill Q1 2025', date: '2025-02-12', tag: 'rechnung' },
    { title: 'Home insurance policy', date: '2025-01-08', tag: 'versicherung' },
    { title: 'Furniture store invoice', date: '2024-11-20', tag: 'rechnung' },
    { title: 'Bathroom repair receipt', date: '2024-10-03', tag: 'rechnung' },
    { title: 'Property tax notice', date: '2025-03-01', tag: 'steuer' },
    { title: 'Utility statement 2024', date: '2025-02-28', tag: 'rechnung' },
    { title: 'Fiber internet contract', date: '2024-09-15', tag: 'vertrag' },
  ],
};

const FILLER_TITLES = {
  de: {
    steuern: [
      'Lohnsteuer 2024',
      'Umsatzsteuer Q4',
      'Steuerbescheid 2023',
      'Freiberufler Vorauszahlung',
      'Spendenquittung',
      'Kirchensteuer',
    ],
    vertraege: ['Mietvertrag Wohnung', 'Handyvertrag', 'Wartungsvertrag Heizung'],
    versicherungen: [
      'Kfz-Versicherung',
      'Haftpflicht Police',
      'Rechtsschutz Vertrag',
      'Berufsunfähigkeit',
      'Reiseversicherung',
      'Zahnzusatz Police',
      'Unfallversicherung',
      'Hausrat Schadenmeldung',
    ],
    fahrzeug: ['TÜV Bericht', 'Werkstattrechnung', 'Tankbelege Januar', 'Fahrzeugschein Kopie', 'Leasingvertrag'],
    arbeit: [
      'Gehaltsabrechnung Jan',
      'Gehaltsabrechnung Feb',
      'Gehaltsabrechnung Mär',
      'Arbeitsvertrag',
      'Zeugnis Praktikum',
      'Weiterbildung Rechnung',
      'Reisekosten Q1',
      'Betriebsvereinbarung',
      'Homeoffice Nachweis',
      'Krankmeldung Scan',
      'Projektvertrag',
      'Bonus Abrechnung',
      'Fortbildungszertifikat',
      'Pensionsinfo',
    ],
  },
  en: {
    steuern: [
      'Income tax 2024',
      'VAT return Q4',
      'Tax assessment 2023',
      'Freelance prepayment',
      'Donation receipt',
      'Church tax',
    ],
    vertraege: ['Apartment lease', 'Mobile plan', 'Heating service contract'],
    versicherungen: [
      'Auto insurance',
      'Liability policy',
      'Legal protection',
      'Disability cover',
      'Travel insurance',
      'Dental add-on',
      'Accident policy',
      'Home claim form',
    ],
    fahrzeug: ['Inspection report', 'Garage invoice', 'Fuel receipts Jan', 'Registration copy', 'Lease agreement'],
    arbeit: [
      'Payslip Jan',
      'Payslip Feb',
      'Payslip Mar',
      'Employment contract',
      'Internship certificate',
      'Training invoice',
      'Travel expenses Q1',
      'Works agreement',
      'Remote work proof',
      'Sick note scan',
      'Project contract',
      'Bonus statement',
      'Training certificate',
      'Pension info',
    ],
  },
};

async function ensureUser() {
  const res = await fetch(`${AUTH_BASE}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
  });
  if (!res.ok && res.status !== 422) {
    const text = await res.text();
    throw new Error(`sign-up failed ${res.status}: ${text}`);
  }
}

async function signInCookie() {
  const signIn = await fetch(`${AUTH_BASE}/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookies = signIn.headers.getSetCookie?.() ?? [];
  if (!signIn.ok || cookies.length === 0) {
    throw new Error(`sign-in failed ${signIn.status}`);
  }
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function wipeUser(pool, userId) {
  await pool.query('DELETE FROM documents WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM folders WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM mappen WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM tags WHERE user_id = $1', [userId]);
}

async function insertDocument(pool, userId, { title, folderId, documentDate, tagId }) {
  const id = randomUUID();
  const filename = `${title.replace(/\s+/g, '_').slice(0, 48)}.pdf`;
  await pool.query(
    `INSERT INTO documents (
       id, user_id, filename, mime_type, storage_key, status, extracted_text, title,
       document_date, folder_id, updated_at
     ) VALUES ($1, $2, $3, 'application/pdf', $4, 'ready', $5, $6, $7, $8, now())`,
    [id, userId, filename, `seed/${id}.pdf`, title, title, documentDate ?? null, folderId]
  );
  if (tagId) {
    await pool.query(`INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2)`, [id, tagId]);
  }
}

async function main() {
  await ensureUser();
  const cookie = await signInCookie();
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const userRes = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [EMAIL]);
  const userId = userRes.rows[0]?.id;
  if (!userId) {
    throw new Error(`User missing after sign-up: ${EMAIL}`);
  }

  await wipeUser(pool, userId);

  const copy = COPY[LOCALE];
  const mappeId = randomUUID();
  await pool.query(
    `INSERT INTO mappen (id, user_id, name, created_at, updated_at) VALUES ($1, $2, $3, now(), now())`,
    [mappeId, userId, copy.mappe]
  );

  const tagIds = {};
  for (const [key, name] of Object.entries(copy.tags)) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
       VALUES ($1, $2, $3, '#64748b', false, 'none', '')`,
      [id, userId, name]
    );
    tagIds[key] = id;
  }

  async function createFolder(name, parentId = null) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO folders (id, user_id, name, parent_id, mappe_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())`,
      [id, userId, name, parentId, mappeId]
    );
    return id;
  }

  const folderIds = {};
  folderIds.haushalt = await createFolder(copy.folders.haushalt);
  folderIds.steuern = await createFolder(copy.folders.steuern);
  folderIds.vertraege = await createFolder(copy.folders.vertraege);
  folderIds.versicherungen = await createFolder(copy.folders.versicherungen, folderIds.vertraege);
  folderIds.fahrzeug = await createFolder(copy.folders.fahrzeug);
  folderIds.arbeit = await createFolder(copy.folders.arbeit);

  for (const spec of FOCUS_DOCS[LOCALE]) {
    await insertDocument(pool, userId, {
      title: spec.title,
      folderId: folderIds.haushalt,
      documentDate: spec.date,
      tagId: tagIds[spec.tag],
    });
  }

  for (const title of FILLER_TITLES[LOCALE].steuern) {
    await insertDocument(pool, userId, {
      title,
      folderId: folderIds.steuern,
      documentDate: '2024-12-01',
      tagId: tagIds.steuer,
    });
  }
  for (const title of FILLER_TITLES[LOCALE].vertraege) {
    await insertDocument(pool, userId, {
      title,
      folderId: folderIds.vertraege,
      documentDate: '2024-08-01',
      tagId: tagIds.vertrag,
    });
  }
  for (const title of FILLER_TITLES[LOCALE].versicherungen) {
    await insertDocument(pool, userId, {
      title,
      folderId: folderIds.versicherungen,
      documentDate: '2024-07-15',
      tagId: tagIds.versicherung,
    });
  }
  for (const title of FILLER_TITLES[LOCALE].fahrzeug) {
    await insertDocument(pool, userId, {
      title,
      folderId: folderIds.fahrzeug,
      documentDate: '2025-01-20',
      tagId: tagIds.rechnung,
    });
  }
  for (const title of FILLER_TITLES[LOCALE].arbeit) {
    await insertDocument(pool, userId, {
      title,
      folderId: folderIds.arbeit,
      documentDate: '2025-03-10',
      tagId: tagIds.rechnung,
    });
  }

  await pool.end();

  const sessionToken = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith('better-auth.session_token='));
  const authCookie = sessionToken ? sessionToken.split('=').slice(1).join('=') : cookie;

  console.log(
    JSON.stringify(
      {
        locale: LOCALE,
        authCookie,
        mappeId,
        mappeName: copy.mappe,
        focusFolderId: folderIds.haushalt,
        focusFolderName: copy.folders.haushalt,
        contractsFolderName: copy.folders.vertraege,
        insuranceFolderName: copy.folders.versicherungen,
        expectedFocusDocCount: FOCUS_DOCS[LOCALE].length,
        folderCounts: {
          haushalt: FOCUS_DOCS[LOCALE].length,
          steuern: FILLER_TITLES[LOCALE].steuern.length,
          vertraege: FILLER_TITLES[LOCALE].vertraege.length,
          versicherungen: FILLER_TITLES[LOCALE].versicherungen.length,
          fahrzeug: FILLER_TITLES[LOCALE].fahrzeug.length,
          arbeit: FILLER_TITLES[LOCALE].arbeit.length,
        },
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
