#!/usr/bin/env node
/**
 * Seeds the E2E smoke user with German cited-chat bench documents (ADR 024).
 * Uses the HTTP API only (no direct chunk SQL). Local / compose helper; Playwright
 * Compose-smoke seeds this after the smoke user (see ci.yml).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const AUTH_BASE = process.env.AUTH_BASE ?? process.env.VITE_API_URL ?? 'http://localhost:3001';
const EMAIL = process.env.E2E_SMOKE_EMAIL ?? 'alex.upload@fixture.docuvate.test';
const PASSWORD = process.env.E2E_SMOKE_PASSWORD ?? 'E2eSmokeFixture1!';
const NAME = process.env.E2E_SMOKE_NAME ?? 'Alex Testmann';

const pdfPath = join(process.cwd(), 'e2e/fixtures/synthetic-upload.pdf');
const pdfBuffer = readFileSync(pdfPath);

const FIXTURES = [
  {
    filename: 'rechnung-nordwind.pdf',
    title: 'Rechnung Nordwind GmbH',
    text: 'Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000',
  },
  {
    filename: 'mietvertrag.pdf',
    title: 'Mietvertrag Wohnung',
    text: 'Mietvertrag Wohnung\nDie Miete ist bis zum 3. Werktag des Monats fällig.',
  },
  {
    filename: 'arbeitsvertrag.pdf',
    title: 'Arbeitsvertrag',
    text: 'Arbeitsvertrag\nDie Kündigungsfrist beträgt drei Monate zum Quartalsende.',
  },
  {
    filename: 'hundesteuer.pdf',
    title: 'Bescheid Hundesteuer',
    text: 'Bescheid Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR',
  },
];

function block(text) {
  return [
    {
      page: 1,
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.05,
      text,
      blockIndex: 0,
    },
  ];
}

async function signIn() {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const signUp = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: NAME }),
    });
    if (!signUp.ok && signUp.status !== 422) {
      throw new Error(`sign-up failed ${signUp.status}: ${await signUp.text()}`);
    }
    const retry = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!retry.ok) {
      throw new Error(`sign-in failed ${retry.status}: ${await retry.text()}`);
    }
    return retry.headers.get('set-cookie') ?? '';
  }
  return res.headers.get('set-cookie') ?? '';
}

async function api(cookie, method, path, body) {
  const headers = { origin: WEB_ORIGIN };
  if (cookie) {
    headers.cookie = cookie.split(';')[0];
  }
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body != null) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${AUTH_BASE}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function waitDocumentReady(cookie, id) {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const doc = await api(cookie, 'GET', `/v1/documents/${id}`);
    if (doc.status === 'ready') {
      return;
    }
    if (doc.status === 'failed') {
      throw new Error(`document ${id} extraction failed`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`timeout waiting for document ${id}`);
}

async function uploadFixture(cookie, fixture) {
  const form = new FormData();
  form.append(
    'file',
    new Blob([pdfBuffer], { type: 'application/pdf' }),
    fixture.filename
  );
  const created = await api(cookie, 'POST', '/v1/documents', form);
  await waitDocumentReady(cookie, created.id);
  await api(cookie, 'PATCH', `/v1/documents/${created.id}`, {
    title: fixture.title,
    extractionBlocks: block(fixture.text),
  });
}

const cookie = await signIn();
for (const fixture of FIXTURES) {
  await uploadFixture(cookie, fixture);
}
console.log(`Cited-chat bench fixtures ready for ${EMAIL}`);
