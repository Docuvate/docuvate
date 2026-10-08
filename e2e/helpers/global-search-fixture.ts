import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';

const pdfPath = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

let sharedProvision: Promise<GlobalSearchFixtureCreds> | null = null;

/** One API provision per Playwright run (avoids auth rate limits). */
export function provisionGlobalSearchLibraryOnce(
  request: APIRequestContext,
  opts: { apiBase: string; webOrigin: string }
): Promise<GlobalSearchFixtureCreds> {
  if (!sharedProvision) {
    sharedProvision = provisionGlobalSearchLibrary(request, opts);
  }
  return sharedProvision;
}

export type GlobalSearchFixtureCreds = {
  email: string;
  password: string;
};

async function signUpAndIn(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<GlobalSearchFixtureCreds> {
  const email = `e2e-gsearch-${randomUUID().slice(0, 8)}@fixture.docuvate.test`;
  const password = 'E2eGlobalSearchFixture1!';
  const headers = { origin: webOrigin };

  await request.post(`${apiBase}/api/auth/sign-up/email`, {
    headers,
    data: { email, password, name: 'E2E Global Search' },
  });
  const login = await request.post(`${apiBase}/api/auth/sign-in/email`, {
    headers,
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(`sign-in failed: ${login.status()} ${await login.text()}`);
  }
  return { email, password };
}

async function uploadPdf(request: APIRequestContext, apiBase: string, filename: string) {
  const res = await request.post(`${apiBase}/v1/documents`, {
    multipart: {
      file: {
        name: filename,
        mimeType: 'application/pdf',
        buffer: fs.readFileSync(pdfPath),
      },
    },
  });
  if (!res.ok()) {
    throw new Error(`upload ${filename}: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function patchDocument(
  request: APIRequestContext,
  apiBase: string,
  id: string,
  patch: Record<string, unknown>
) {
  const res = await request.patch(`${apiBase}/v1/documents/${id}`, { data: patch });
  if (!res.ok()) {
    throw new Error(`patch ${id}: ${res.status()} ${await res.text()}`);
  }
}

/** Creates Rechnung + Kontoauszug fixtures via public API (indexes search on update). */
export async function provisionGlobalSearchLibrary(
  request: APIRequestContext,
  opts: { apiBase: string; webOrigin: string }
): Promise<GlobalSearchFixtureCreds> {
  const creds = await signUpAndIn(request, opts.apiBase, opts.webOrigin);

  const defs = await request.put(`${opts.apiBase}/v1/recognized-fields`, {
    data: {
      fields: [
        { key: 'absender', label: 'Absender', fieldType: 'text', extractForAllDocuments: true },
        { key: 'betrag', label: 'Betrag', fieldType: 'currency', extractForAllDocuments: true },
      ],
    },
  });
  if (!defs.ok()) {
    throw new Error(`recognized-fields: ${defs.status()} ${await defs.text()}`);
  }

  const rechnungId = await uploadPdf(request, opts.apiBase, 'rechnung.pdf');
  await patchDocument(request, opts.apiBase, rechnungId, {
    title: 'Rechnung Nordwind GmbH',
    notes: 'Rechnung über Beratungsleistungen im ersten Quartal.',
    extractionFields: [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }],
  });

  const kontoId = await uploadPdf(request, opts.apiBase, 'kontoauszug.pdf');
  await patchDocument(request, opts.apiBase, kontoId, {
    title: 'Kontoauszug Nordwind',
    notes: 'Der monatliche Kontoauszug weist eine Gebühr für den Zahlungsverkehr aus.',
  });

  return creds;
}
