#!/usr/bin/env node
/**
 * Seeds synthetic Paperless-ngx fixtures for Docuvate import E2E tests.
 * Requires the paperless-test compose stack (port 18080).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)));
const baseUrl = (process.env.PAPERLESS_TEST_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');
const username = process.env.PAPERLESS_TEST_USER ?? 'docuvate-test';
const password = process.env.PAPERLESS_TEST_PASSWORD ?? 'docuvate-test-secret';

async function obtainToken() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 15_000));
      continue;
    }
    if (!response.ok) {
      throw new Error(`token failed: ${response.status}`);
    }
    const body = await response.json();
    const token = body.token?.trim();
    if (!token) {
      throw new Error('token missing in response');
    }
    return token;
  }
  throw new Error('token failed: rate limited');
}

async function detectApiVersion(token) {
  for (const version of [3, 2, 0]) {
    const accept =
      version === 0 ? 'application/json' : `application/json; version=${version}`;
    const response = await fetch(`${baseUrl}/api/documents/?page=1&page_size=1`, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: accept,
      },
    });
    if (response.ok) {
      return version === 0 ? 3 : version;
    }
  }
  throw new Error('could not detect Paperless API version');
}

function authHeaders(token, apiVersion) {
  const accept =
    apiVersion === 3 ? 'application/json' : `application/json; version=${apiVersion}`;
  return {
    Authorization: `Token ${token}`,
    Accept: accept,
  };
}

async function api(token, apiVersion, path, init = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(authHeaders(token, apiVersion))) {
    headers.set(key, value);
  }
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed ${response.status}: ${text.slice(0, 200)}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function findNamedId(token, apiVersion, path, name) {
  const list = await api(token, apiVersion, `${path}?page_size=200`);
  const match = list.results?.find((row) => row.name === name);
  return match?.id ?? null;
}

async function createNamed(token, apiVersion, path, name, extra = {}) {
  const existing = await findNamedId(token, apiVersion, path, name);
  if (existing != null) {
    return existing;
  }
  const row = await api(token, apiVersion, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...extra }),
  });
  return row.id;
}

function tinyPdf(label) {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 50 100 Td (${label.slice(0, 20)}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
308
%%EOF`;
  return Buffer.from(content, 'utf8');
}

const fixtures = [
  { title: 'Steuerbescheid 2024 Musterstadt', tag: 'Steuer', type: 'Behörde', corr: 'Finanzamt Musterstadt', path: 'Behörden/Steuer', text: 'Einkommensteuerbescheid für Musterperson.' },
  { title: 'Mietvertrag Wohnung Parkstraße', tag: 'Miete', type: 'Vertrag', corr: 'Hausverwaltung Park', path: 'Verträge/Miete', text: 'Mietvertrag unbefristet, Kaltmiete 890 Euro.' },
  { title: 'Rezept Kartoffelsuppe', tag: 'Kochen', type: 'Rezept', corr: 'Familienmappe', path: 'Privat/Rezepte', text: 'Kartoffeln, Zwiebeln, Brühe, 30 Minuten köcheln.' },
  { title: 'Baugenehmigung Carport', tag: 'Bau', type: 'Genehmigung', corr: 'Bauamt Musterstadt', path: 'Behörden/Bau', text: 'Genehmigung für Carport 3x6 Meter.' },
  { title: 'Brief Nachbarin Hecke', tag: 'Nachbarschaft', type: 'Brief', corr: 'Erika Beispiel', path: 'Privat/Briefe', text: 'Bitte Hecke bis 15. April zurückschneiden.' },
  { title: 'Notenblatt Volkslied', tag: 'Musik', type: 'Noten', corr: 'Chor Musterdorf', path: 'Privat/Musik', text: 'Text und Melodie eigenhändig notiert. La la la.' },
  { title: 'Versicherungsbeitrag 2025', tag: 'Versicherung', type: 'Rechnung', corr: 'Muster Versicherung AG', path: 'Finanzen/Versicherung', text: 'Jahresbeitrag Haftpflicht.' },
  { title: 'Stromrechnung Januar', tag: 'Energie', type: 'Rechnung', corr: 'Stadtwerke Muster', path: 'Finanzen/Energie', text: 'Abschlag 120 Euro.' },
  { title: 'Arbeitsvertrag Praktikum', tag: 'Arbeit', type: 'Vertrag', corr: 'Beispiel GmbH', path: 'Verträge/Arbeit', text: 'Praktikum IT, 6 Monate.' },
  { title: 'Kontoauszug Februar', tag: 'Bank', type: 'Konto', corr: 'Musterbank', path: 'Finanzen/Bank', text: 'Saldo 1.234,56 Euro.' },
];

async function main() {
  const token = await obtainToken();
  const apiVersion = await detectApiVersion(token);
  const existingDocs = await api(token, apiVersion, '/api/documents/?page=1&page_size=1');
  if (existingDocs.count >= fixtures.length) {
    const manifest = {
      baseUrl,
      username,
      documentCount: existingDocs.count,
      customFieldId: null,
      apiVersion,
    };
    const outPath = join(root, 'seed-manifest.json');
    writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    console.log(`Paperless already has ${existingDocs.count} documents. Manifest: ${outPath}`);
    return;
  }
  const tagIds = new Map();
  const typeIds = new Map();
  const corrIds = new Map();
  const pathIds = new Map();

  const customFieldId = await createNamed(token, apiVersion, '/api/custom_fields/', 'Vertragsnummer', {
    data_type: 'string',
  });

  for (const fixture of fixtures) {
    if (!tagIds.has(fixture.tag)) {
      tagIds.set(
        fixture.tag,
        await createNamed(token, apiVersion, '/api/tags/', fixture.tag, { color: '#3b82f6' })
      );
    }
    if (!typeIds.has(fixture.type)) {
      typeIds.set(fixture.type, await createNamed(token, apiVersion, '/api/document_types/', fixture.type));
    }
    if (!corrIds.has(fixture.corr)) {
      corrIds.set(fixture.corr, await createNamed(token, apiVersion, '/api/correspondents/', fixture.corr));
    }
    if (!pathIds.has(fixture.path)) {
      pathIds.set(
        fixture.path,
        await createNamed(token, apiVersion, '/api/storage_paths/', fixture.path, { path: fixture.path })
      );
    }

    const form = new FormData();
    const blob = new Blob([tinyPdf(fixture.title)], { type: 'application/pdf' });
    form.append('document', blob, `${fixture.title.replace(/\s+/g, '_')}.pdf`);
    form.append('title', fixture.title);
    form.append('content', fixture.text);
    form.append('tags', String(tagIds.get(fixture.tag)));
    form.append('document_type', String(typeIds.get(fixture.type)));
    form.append('correspondent', String(corrIds.get(fixture.corr)));
    form.append('storage_path', String(pathIds.get(fixture.path)));
    form.append(
      'custom_fields',
      JSON.stringify({ [String(customFieldId)]: `SYN-${fixture.title.length}` })
    );

    const upload = await fetch(`${baseUrl}/api/documents/post_document/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: form,
    });
    if (!upload.ok) {
      const detail = await upload.text();
      throw new Error(`upload ${fixture.title} failed: ${upload.status} ${detail.slice(0, 300)}`);
    }
  }

  const deadline = Date.now() + 300_000;
  let readyCount = 0;
  while (Date.now() < deadline) {
    const docs = await api(token, apiVersion, '/api/documents/?page=1&page_size=1');
    readyCount = docs.count;
    if (readyCount >= fixtures.length) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  if (readyCount < fixtures.length) {
    throw new Error(`only ${readyCount}/${fixtures.length} documents visible after upload`);
  }

  const manifest = {
    baseUrl,
    username,
    documentCount: readyCount,
    customFieldId,
    apiVersion,
  };
  const outPath = join(root, 'seed-manifest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Seeded ${readyCount} documents. Manifest: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
