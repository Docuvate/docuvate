import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';

const pdfPath = path.join(process.cwd(), 'fixtures/synthetic-upload.pdf');

export type CitedChatFixtureCreds = {
  email: string;
  password: string;
  invoiceDocId: string;
  taxDocId: string;
  leaseDocId: string;
  contractDocId: string;
};

let sharedProvision: Promise<CitedChatFixtureCreds> | null = null;

export function provisionCitedChatLibraryOnce(
  request: APIRequestContext,
  opts: { apiBase: string; webOrigin: string }
): Promise<CitedChatFixtureCreds> {
  if (!sharedProvision) {
    sharedProvision = provisionCitedChatLibrary(request, opts);
  }
  return sharedProvision;
}

async function signUpAndIn(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string
): Promise<{ email: string; password: string }> {
  const email = `e2e-cited-${randomUUID().slice(0, 8)}@fixture.docuvate.test`;
  const password = 'E2eCitedChatFixture1!';
  const headers = { origin: webOrigin };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const signUp = await request.post(`${apiBase}/api/auth/sign-up/email`, {
      headers,
      data: { email, password, name: 'E2E Cited Chat' },
    });
    if (signUp.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    const login = await request.post(`${apiBase}/api/auth/sign-in/email`, {
      headers,
      data: { email, password },
    });
    if (login.status() === 429) {
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
      continue;
    }
    if (!login.ok()) {
      throw new Error(`sign-in failed: ${login.status()} ${await login.text()}`);
    }
    return { email, password };
  }
  throw new Error('sign-in rate limited');
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

function block(text: string) {
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

export async function provisionCitedChatLibrary(
  request: APIRequestContext,
  opts: { apiBase: string; webOrigin: string }
): Promise<CitedChatFixtureCreds> {
  const creds = await signUpAndIn(request, opts.apiBase, opts.webOrigin);
  const invoiceDocId = await uploadPdf(request, opts.apiBase, 'rechnung-nordwind.pdf');
  await request.patch(`${opts.apiBase}/v1/documents/${invoiceDocId}`, {
    data: {
      title: 'Rechnung Nordwind GmbH',
      extractionBlocks: block(
        'Rechnung Nordwind GmbH. Gesamtsumme: 1.234,56 EUR. IBAN DE89370400440532013000.'
      ),
    },
  });
  const taxDocId = await uploadPdf(request, opts.apiBase, 'hundesteuer.pdf');
  await request.patch(`${opts.apiBase}/v1/documents/${taxDocId}`, {
    data: {
      title: 'Bescheid Hundesteuer',
      extractionBlocks: block('Hundesteuer Stadt Muster. Jahresgebühr: 120,00 EUR.'),
    },
  });
  const leaseDocId = await uploadPdf(request, opts.apiBase, 'mietvertrag.pdf');
  await request.patch(`${opts.apiBase}/v1/documents/${leaseDocId}`, {
    data: {
      title: 'Mietvertrag Wohnung',
      extractionBlocks: block(
        'Mietvertrag Wohnung. Die Miete ist bis zum 3. Werktag des Monats fällig.'
      ),
    },
  });
  const contractDocId = await uploadPdf(request, opts.apiBase, 'arbeitsvertrag.pdf');
  await request.patch(`${opts.apiBase}/v1/documents/${contractDocId}`, {
    data: {
      title: 'Arbeitsvertrag',
      extractionBlocks: block(
        'Arbeitsvertrag. Die Kündigungsfrist beträgt drei Monate zum Quartalsende.'
      ),
    },
  });
  await waitForDocumentReady(request, opts.apiBase, leaseDocId);
  return { ...creds, invoiceDocId, taxDocId, leaseDocId, contractDocId };
}

async function waitForDocumentReady(
  request: APIRequestContext,
  apiBase: string,
  documentId: string
) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const res = await request.get(`${apiBase}/v1/documents/${documentId}`);
    if (res.ok()) {
      const doc = (await res.json()) as { status: string };
      if (doc.status === 'ready') {
        return;
      }
      if (doc.status === 'failed') {
        throw new Error(`document ${documentId} extraction failed`);
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`timeout waiting for document ${documentId}`);
}
