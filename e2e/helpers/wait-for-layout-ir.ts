import { expect, type APIRequestContext } from '@playwright/test';

interface DocumentReadyState {
  status: string;
  layoutIrAvailable: boolean;
  failureReason: string;
}

function readDocumentReadyState(body: unknown): DocumentReadyState {
  if (typeof body !== 'object' || body === null) {
    return { status: 'unknown', layoutIrAvailable: false, failureReason: '' };
  }
  const status = 'status' in body && typeof body.status === 'string' ? body.status : 'unknown';
  const extraction =
    'extraction' in body && typeof body.extraction === 'object' && body.extraction !== null
      ? body.extraction
      : null;
  const layoutIrAvailable =
    extraction !== null &&
    'layoutIrAvailable' in extraction &&
    extraction.layoutIrAvailable === true;
  const failureReason =
    'extractionFailureReason' in body && typeof body.extractionFailureReason === 'string'
      ? body.extractionFailureReason
      : '';
  return { status, layoutIrAvailable, failureReason };
}

function readHealthStatus(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return 'unknown';
  }
  if (!('status' in body) || typeof body.status !== 'string') {
    return 'unknown';
  }
  return body.status;
}

export async function waitForSmokeApiReady(
  request: APIRequestContext,
  apiBase: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const res = await request.get(`${apiBase}/health/ready`);
        if (!res.ok()) {
          return `http-${String(res.status())}`;
        }
        return readHealthStatus(await res.json());
      },
      { timeout: 60_000, intervals: [1000, 2000, 3000] }
    )
    .toBe('ready');
}

export async function waitForDocumentLayoutIrReady(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  docId: string
): Promise<void> {
  let requeued = false;
  await expect
    .poll(
      async () => {
        const docRes = await request.get(`${apiBase}/v1/documents/${docId}`, {
          headers: { origin: webOrigin },
        });
        if (!docRes.ok()) {
          return `document-${String(docRes.status())}`;
        }
        const doc = readDocumentReadyState(await docRes.json());
        if (doc.status === 'failed') {
          if (!requeued) {
            requeued = true;
            const rq = await request.post(`${apiBase}/v1/documents/${docId}/extraction/requeue`, {
              headers: { origin: webOrigin },
            });
            if (rq.ok()) {
              return 'requeued';
            }
          }
          const reason = doc.failureReason.length > 0 ? doc.failureReason : 'unknown';
          throw new Error(`document extraction failed (${docId}): ${reason}`);
        }
        if (doc.status !== 'ready') {
          return `status-${doc.status}`;
        }
        if (!doc.layoutIrAvailable) {
          return 'layout-ir-unavailable';
        }
        const irRes = await request.get(`${apiBase}/v1/documents/${docId}/layout-ir`, {
          headers: { origin: webOrigin },
        });
        if (!irRes.ok()) {
          return `layout-ir-${String(irRes.status())}`;
        }
        return 'ready';
      },
      { timeout: 160_000, intervals: [2000, 3000, 5000] }
    )
    .toBe('ready');
}
