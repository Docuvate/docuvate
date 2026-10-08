import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCREENSHOT_CHAT,
  SCREENSHOT_INVOICE,
  SCREENSHOT_OTHER_DOCS,
  SCREENSHOT_TAGS,
  SCREENSHOT_USER,
} from './screenshot-seed-data.mjs';

const siteScripts = dirname(fileURLToPath(import.meta.url));
const demoDir = join(siteScripts, '../../web/public/demo');
const webUrl = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const authStatePath =
  process.env.SCREENSHOT_AUTH_STATE ?? join(siteScripts, '.screenshot-auth.json');
const manifestPath =
  process.env.SCREENSHOT_MANIFEST ?? join(siteScripts, '.screenshot-manifest.json');

/** German labels for marketing screenshots (heuristic keys are English until mapped). */
const SCREENSHOT_RECOGNIZED_FIELDS = [
  { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true, sortOrder: 0 },
  { key: 'datum', label: 'Datum', fieldType: 'date', extractForAllDocuments: true, sortOrder: 1 },
  { key: 'absender', label: 'Absender', fieldType: 'text', extractForAllDocuments: true, sortOrder: 2 },
];

const HEURISTIC_TO_GLOBAL = {
  amount: 'betrag',
  date: 'datum',
  vendor: 'absender',
};

function marketingExtractionFields(fields) {
  const byKey = Object.fromEntries((fields ?? []).map((f) => [f.key, f.value]));
  const out = [];
  for (const [heuristic, globalKey] of Object.entries(HEURISTIC_TO_GLOBAL)) {
    const value = byKey[heuristic] ?? byKey[`global:${globalKey}`];
    if (value != null && String(value).trim() !== '') {
      out.push({ key: `global:${globalKey}`, value: String(value) });
    }
  }
  return out.length > 0 ? out : fields ?? [];
}

async function registerOrLogin(page) {
  const signup = await page.request.post(`${webUrl}/api/auth/sign-up/email`, {
    data: {
      name: SCREENSHOT_USER.name,
      email: SCREENSHOT_USER.email,
      password: SCREENSHOT_USER.password,
    },
  });
  if (!signup.ok()) {
    const signin = await page.request.post(`${webUrl}/api/auth/sign-in/email`, {
      data: {
        email: SCREENSHOT_USER.email,
        password: SCREENSHOT_USER.password,
      },
    });
    if (!signin.ok()) {
      throw new Error(
        `Auth failed (sign-up ${signup.status()}, sign-in ${signin.status()}): ${await signin.text()}`
      );
    }
  }
  await page.goto(`${webUrl}/documents`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('.page', { timeout: 60_000 });
}

async function apiJson(page, path, init = {}) {
  const res = await page.request.fetch(`${webUrl}/api/v1${path}`, init);
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`API ${path} ${res.status()}: ${body.slice(0, 400)}`);
  }
  if (res.status() === 204) return null;
  return res.json();
}

async function uploadFile(page, filePath, filename) {
  const buffer = readFileSync(filePath);
  const mime = filename.endsWith('.png')
    ? 'image/png'
    : filename.endsWith('.jpg')
      ? 'image/jpeg'
      : 'application/pdf';
  const res = await page.request.post(`${webUrl}/api/v1/documents`, {
    multipart: {
      file: { name: filename, mimeType: mime, buffer },
    },
  });
  if (!res.ok()) {
    throw new Error(`Upload ${filename} failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

async function waitForDocumentReady(page, docId, timeoutMs = 600_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const doc = await apiJson(page, `/documents/${docId}`);
    if (doc.status === 'ready') return doc;
    if (doc.status === 'failed') throw new Error(`Document ${docId} extraction failed`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Document ${docId} not ready within ${timeoutMs}ms`);
}

async function clearUserDocuments(page) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const list = (await apiJson(page, '/documents')).items ?? [];
    if (list.length === 0) {
      return;
    }
    for (const doc of list) {
      await apiJson(page, `/documents/${doc.id}`, { method: 'DELETE' });
    }
  }
  const remaining = (await apiJson(page, '/documents')).items ?? [];
  if (remaining.length > 0) {
    throw new Error(`Could not clear screenshot documents (${remaining.length} remaining)`);
  }
}

async function main() {
  mkdirSync(dirname(authStatePath), { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await registerOrLogin(page);

  await apiJson(page, '/recognized-fields', {
    method: 'PUT',
    data: { fields: SCREENSHOT_RECOGNIZED_FIELDS },
  });

  const tagIds = {};
  const existingTags = (await apiJson(page, '/tags')).items ?? [];
  for (const spec of SCREENSHOT_TAGS) {
    let tag = existingTags.find((t) => t.name === spec.name);
    if (!tag) {
      tag = await apiJson(page, '/tags', {
        method: 'POST',
        data: {
          name: spec.name,
          color: spec.color,
          isInbox: spec.isInbox ?? false,
        },
      });
    }
    tagIds[spec.name] = tag.id;
  }

  await clearUserDocuments(page);

  const allSpecs = [SCREENSHOT_INVOICE, ...SCREENSHOT_OTHER_DOCS];
  const uploaded = [];
  for (const spec of allSpecs) {
    uploaded.push(await uploadFile(page, join(demoDir, spec.filename), spec.filename));
  }

  let invoice = uploaded.find((d) => d.filename === SCREENSHOT_INVOICE.filename);
  if (!invoice?.id) {
    throw new Error('Invoice upload missing');
  }
  const invoiceId = invoice.id;

  for (const doc of uploaded) {
    await waitForDocumentReady(page, doc.id);
  }

  let finanzenFolder = (await apiJson(page, '/folders')).items?.find((f) => f.name === 'Finanzen 2024');
  if (!finanzenFolder) {
    finanzenFolder = await apiJson(page, '/folders', {
      method: 'POST',
      data: { name: 'Finanzen 2024' },
    });
  }
  let vertraegeFolder = (await apiJson(page, '/folders')).items?.find((f) => f.name === 'Verträge');
  if (!vertraegeFolder) {
    vertraegeFolder = await apiJson(page, '/folders', {
      method: 'POST',
      data: { name: 'Verträge' },
    });
  }

  const folderByFilename = {
    'rechnung-beispiel-2024-001.pdf': finanzenFolder.id,
    'kontoauszug-januar.pdf': finanzenFolder.id,
    'mietvertrag-beispiel.pdf': vertraegeFolder.id,
    'versicherungsbescheinigung.pdf': vertraegeFolder.id,
  };

  for (const spec of allSpecs) {
    const doc = uploaded.find((d) => d.filename === spec.filename);
    if (!doc) continue;
    const ids = (spec.tagNames ?? []).map((name) => tagIds[name]).filter(Boolean);
    const folderId = folderByFilename[spec.filename];
    await apiJson(page, `/documents/${doc.id}`, {
      method: 'PATCH',
      data: {
        title: spec.title,
        tagIds: ids,
        ...(spec.filename === SCREENSHOT_INVOICE.filename
          ? { documentDate: '2024-03-15' }
          : {}),
        ...(folderId ? { folderId } : {}),
      },
    });
  }

  invoice = await apiJson(page, `/documents/${invoiceId}`);

  const normalizedFields = marketingExtractionFields(
    invoice.extraction?.fields ?? invoice.extractionFields ?? []
  );
  if (normalizedFields.length > 0) {
    invoice = await apiJson(page, `/documents/${invoiceId}`, {
      method: 'PATCH',
      data: { extractionFields: normalizedFields },
    });
  }

  const threadsRes = await apiJson(page, `/documents/${invoiceId}/chat/threads`);
  let thread = threadsRes.threads?.[0];
  if (!thread) {
    const created = await apiJson(page, `/documents/${invoiceId}/chat/threads`, {
      method: 'POST',
      data: { title: 'Fragen zur Rechnung' },
    });
    thread = created.thread ?? created;
  }

  const threadId = thread?.id;
  if (!threadId) {
    throw new Error('Chat thread id missing after create/list');
  }

  const messagesRes = await apiJson(
    page,
    `/documents/${invoiceId}/chat/threads/${threadId}/messages`
  );
  if ((messagesRes.messages ?? []).length === 0) {
    await apiJson(page, `/documents/${invoiceId}/chat/threads/${threadId}/messages`, {
      method: 'POST',
      data: { message: SCREENSHOT_CHAT.userMessage },
    });
    await page.waitForTimeout(4000);
  }

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        invoiceDocumentId: invoiceId,
        userEmail: SCREENSHOT_USER.email,
        seededAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  await context.storageState({ path: authStatePath });
  await browser.close();
  console.log('Screenshot stack seeded. Manifest:', manifestPath);
}

await main();
