#!/usr/bin/env node
/**
 * Local processing / ingestion / reliability audit.
 *
 * Cloud agents cannot reach the Mac LAN. Run this on the machine that serves:
 *   web     http://127.0.0.1:5173     (Origin header only; this script does not scrape the UI)
 *   API     http://127.0.0.1:3001     GET /health  GET /health/ready
 *   worker  http://127.0.0.1:8001     GET /v1/health
 *
 * The library/admin agent owns the Playwright runner. This file is the
 * processing-domain script that runner can shell out to. It uses normal
 * sign-up and sign-in. It does not read a browser profile, cookie jar, or
 * existing Authorization header.
 *
 * Safety:
 *   - Refuses any host that is not localhost, 127.0.0.1, or ::1.
 *   - Does nothing on the network unless DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL=1.
 *   - End-to-end uploads run only when DOCUVATE_PROC_AUDIT_E2E=1 as well.
 *   - Creates one new user (proc-audit-<id>@example.test). If sign-up is
 *     invite-only, it stops. It will not sign in as an existing user.
 *   - Uploads only bytes generated in this process.
 *   - Reads and deletes only document ids returned by those uploads.
 *   - Does not list the library, requeue, retry, or call connectors.
 *   - Does not inject faults or restart services.
 *
 * Endpoints used when the matching mode is on:
 *   GET  {API}/health
 *   GET  {API}/health/ready
 *   GET  {WORKER}/v1/health
 *   POST {API}/api/auth/sign-up/email     JSON {name,email,password}  Origin: {WEB}
 *   POST {API}/api/auth/sign-in/email     JSON {email,password}       Origin: {WEB}
 *   POST {API}/v1/documents               multipart field "file"
 *   GET  {API}/v1/documents/{id}          only ids created above
 *   DELETE {API}/v1/documents/{id}        only ids created above
 *
 * Env:
 *   DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL=1   required for any socket use
 *   DOCUVATE_PROC_AUDIT_E2E=1             synthetic upload flow
 *   DOCUVATE_PROC_AUDIT_API    default http://127.0.0.1:3001
 *   DOCUVATE_PROC_AUDIT_WORKER default http://127.0.0.1:8001
 *   DOCUVATE_PROC_AUDIT_WEB    default http://127.0.0.1:5173
 *   DOCUVATE_PROC_AUDIT_REPORT optional path for the JSON report
 *
 * Exit 0: plan printed, or probes finished (a blocked sign-up is a report, not a crash).
 * Exit 2: refused URL.
 * Exit 3: confirmed local probe could not open a health endpoint.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { assertLoopbackBase, auditPlan, syntheticEmail } from './guards.mjs';

const plan = auditPlan(process.env);
const apiBase = process.env.DOCUVATE_PROC_AUDIT_API ?? 'http://127.0.0.1:3001';
const workerBase = process.env.DOCUVATE_PROC_AUDIT_WORKER ?? 'http://127.0.0.1:8001';
const webOrigin = process.env.DOCUVATE_PROC_AUDIT_WEB ?? 'http://127.0.0.1:5173';

const report = {
  domain: 'processing-ingestion-reliability',
  generatedAt: new Date().toISOString(),
  plan,
  env: {
    apiBase,
    workerBase,
    webOrigin,
    note: 'Deployed SHA was not read. This report does not claim the running build matches git.',
  },
  layers: {
    health: 'not-run',
    e2e: 'not-run',
    mock: 'not-this-process',
  },
  health: [],
  documents: [],
  blocked: [],
  cleanup: [],
};

function finish(exitCode) {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const target = process.env.DOCUVATE_PROC_AUDIT_REPORT;
  if (target) {
    writeFileSync(target, json, { encoding: 'utf8', mode: 0o600 });
  }
  process.stdout.write(json);
  process.exit(exitCode);
}

let apiUrl;
let workerUrl;
let webUrl;
try {
  apiUrl = assertLoopbackBase(apiBase, 'DOCUVATE_PROC_AUDIT_API');
  workerUrl = assertLoopbackBase(workerBase, 'DOCUVATE_PROC_AUDIT_WORKER');
  webUrl = assertLoopbackBase(webOrigin, 'DOCUVATE_PROC_AUDIT_WEB');
} catch (error) {
  report.blocked.push({
    code: 'non-loopback',
    detail: error instanceof Error ? error.message : String(error),
  });
  finish(2);
}

if (!plan.probeHealth) {
  report.layers.health = 'skipped-no-local-confirm';
  report.layers.e2e = 'skipped-no-local-confirm';
  report.blocked.push({
    code: 'local-confirm-required',
    detail:
      'Set DOCUVATE_PROC_AUDIT_CONFIRM_LOCAL=1 on the machine that owns 127.0.0.1:3001. Cloud agents must not invent that confirmation.',
  });
  finish(0);
}

async function getJson(url, cookie) {
  const headers = { accept: 'application/json' };
  if (cookie) {
    headers.cookie = cookie;
  }
  const response = await fetch(url, { headers, redirect: 'manual' });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 500) };
}

async function probe(name, url) {
  try {
    const result = await getJson(url);
    const ok = result.status >= 200 && result.status < 300;
    report.health.push({ name, url, status: result.status, ok, layer: 'health' });
    return ok;
  } catch (error) {
    report.health.push({
      name,
      url,
      ok: false,
      layer: 'health',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

const healthOk = await probe('api-live', `${apiUrl.origin}/health`);
await probe('api-ready', `${apiUrl.origin}/health/ready`);
await probe('worker-live', `${workerUrl.origin}/v1/health`);
report.layers.health = healthOk ? 'probed' : 'probed-failed';
if (!healthOk) {
  report.layers.e2e = 'skipped-api-unhealthy';
  finish(3);
}
if (!plan.runE2E) {
  report.layers.e2e = 'skipped-flag-off';
  finish(0);
}

const email = syntheticEmail(randomUUID());
const password = `Pa${randomBytes(18).toString('base64url')}9!`;
const credPath = join(tmpdir(), `docuvate-proc-audit-${email.split('@')[0]}.cred`);
writeFileSync(credPath, `email=${email}\npassword=${password}\n`, { encoding: 'utf8', mode: 0o600 });
report.credentialsFile = credPath;
report.credentialsNote =
  'Password is only in the mode 0600 file above. It is not in this JSON report.';

function collectCookies(response, jar) {
  const next = new Map(jar);
  const list = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  for (const line of list) {
    const pair = line.split(';', 1)[0];
    if (!pair) {
      continue;
    }
    const eq = pair.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    next.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return next;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function authPost(path, body, jar) {
  const response = await fetch(new URL(path, apiUrl).toString(), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: webUrl.origin,
      cookie: cookieHeader(jar),
    },
    body: JSON.stringify(body),
    redirect: 'manual',
  });
  const text = await response.text();
  return { status: response.status, text, jar: collectCookies(response, jar) };
}

let jar = new Map();
const signUp = await authPost(
  '/api/auth/sign-up/email',
  { name: 'Proc Audit', email, password },
  jar
);
jar = signUp.jar;
if (signUp.status < 200 || signUp.status >= 300 || signUp.text.includes('SIGNUP_DISABLED')) {
  report.blocked.push({
    code: 'signup',
    status: signUp.status,
    detail: signUp.text.slice(0, 300),
    layer: 'e2e',
  });
  report.layers.e2e = 'blocked-signup';
  finish(0);
}

const signIn = await authPost('/api/auth/sign-in/email', { email, password }, jar);
jar = signIn.jar;
if (signIn.status < 200 || signIn.status >= 300) {
  report.blocked.push({
    code: 'signin',
    status: signIn.status,
    detail: signIn.text.slice(0, 300),
    layer: 'e2e',
  });
  report.layers.e2e = 'blocked-signin';
  finish(0);
}

function minimalPdf(text) {
  const safe = text.replace(/[^A-Za-z0-9 .,-]/g, '');
  const stream = `BT /F1 18 Tf 72 720 Td (${safe}) Tj ET`;
  const objects = [
    '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n',
    '2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n',
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n',
    `4 0 obj<< /Length ${String(stream.length)} >>stream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += object;
  }
  const xref = Buffer.byteLength(body);
  let xrefBody = `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    xrefBody += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += xrefBody;
  body += `trailer<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}

const samples = [
  {
    kind: 'book',
    filename: 'proc-audit-book.txt',
    mime: 'text/plain',
    body: Buffer.from('Chapter 1. The river atlas lists every bend twice.\n', 'utf8'),
    expect: 'ready-without-ocr-queue',
  },
  {
    kind: 'tax',
    filename: 'proc-audit-tax.txt',
    mime: 'text/plain',
    body: Buffer.from('Tax year 2024. Amount due EUR 120.50. Reference TX-4401.\n', 'utf8'),
    expect: 'ready-without-ocr-queue',
  },
  {
    kind: 'building',
    filename: 'proc-audit-building.txt',
    mime: 'text/plain',
    body: Buffer.from('Building permit BP-17. Storey 3. Load 4.2 kN/m2.\n', 'utf8'),
    expect: 'ready-without-ocr-queue',
  },
  {
    kind: 'recipe',
    filename: 'proc-audit-recipe.txt',
    mime: 'text/plain',
    body: Buffer.from('Recipe. Simmer lentils for 40 minutes. Salt late.\n', 'utf8'),
    expect: 'ready-without-ocr-queue',
  },
  {
    kind: 'lyrics',
    filename: 'proc-audit-lyrics.txt',
    mime: 'text/plain',
    body: Buffer.from('From the hills we came\nwith a copper lantern.\n', 'utf8'),
    expect: 'ready-without-ocr-queue',
  },
  {
    kind: 'tax-pdf',
    filename: 'proc-audit-tax.pdf',
    mime: 'application/pdf',
    body: minimalPdf('Tax notice TX-4401 amount 120.50'),
    expect: 'extraction-queue',
  },
];

function multipart(filename, mime, bytes) {
  const boundary = `----ProcAudit${randomBytes(8).toString('hex')}`;
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`,
    'utf8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat([head, bytes, tail]),
  };
}

async function upload(sample) {
  const form = multipart(sample.filename, sample.mime, sample.body);
  const response = await fetch(new URL('/v1/documents', apiUrl).toString(), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      origin: webUrl.origin,
      cookie: cookieHeader(jar),
      'content-type': form.contentType,
    },
    body: form.body,
    redirect: 'manual',
  });
  const text = await response.text();
  let id = '';
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string') {
      id = parsed.id;
    }
  } catch {
    id = '';
  }
  return { status: response.status, id, text: text.slice(0, 400) };
}

async function readOwn(id) {
  const response = await fetch(new URL(`/v1/documents/${id}`, apiUrl).toString(), {
    headers: {
      accept: 'application/json',
      origin: webUrl.origin,
      cookie: cookieHeader(jar),
    },
    redirect: 'manual',
  });
  const text = await response.text();
  let status = '';
  let failure = null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.status === 'string') {
        status = parsed.status;
      }
      if (typeof parsed.extractionFailureReason === 'string') {
        failure = parsed.extractionFailureReason;
      }
    }
  } catch {
    status = '';
  }
  return { http: response.status, status, failure };
}

async function pollOwn(id, timeoutMs) {
  const started = Date.now();
  let last = { http: 0, status: '', failure: null };
  while (Date.now() - started < timeoutMs) {
    last = await readOwn(id);
    if (last.status === 'ready' || last.status === 'failed') {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return last;
}

const createdIds = [];
for (const sample of samples) {
  const uploaded = await upload(sample);
  if (!uploaded.id) {
    report.documents.push({
      kind: sample.kind,
      filename: sample.filename,
      layer: 'e2e',
      uploadStatus: uploaded.status,
      detail: uploaded.text,
      actual: 'upload-rejected',
    });
    continue;
  }
  createdIds.push(uploaded.id);
  const timeoutMs = sample.expect === 'extraction-queue' ? 90_000 : 20_000;
  const observed = await pollOwn(uploaded.id, timeoutMs);
  report.documents.push({
    kind: sample.kind,
    filename: sample.filename,
    id: uploaded.id,
    layer: 'e2e',
    expected: sample.expect,
    uploadStatus: uploaded.status,
    http: observed.http,
    status: observed.status,
    failure: observed.failure,
    actual: observed.status || 'no-status',
  });
}

for (const id of createdIds) {
  const response = await fetch(new URL(`/v1/documents/${id}`, apiUrl).toString(), {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      origin: webUrl.origin,
      cookie: cookieHeader(jar),
    },
    redirect: 'manual',
  });
  report.cleanup.push({ id, http: response.status, scope: 'synthetic-user-created-this-run' });
}

report.layers.e2e = 'ran';
finish(0);
