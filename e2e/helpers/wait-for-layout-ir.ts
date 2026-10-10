import { expect, type APIRequestContext } from '@playwright/test';

export async function waitForDocumentLayoutIrReady(
  request: APIRequestContext,
  apiBase: string,
  webOrigin: string,
  docId: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const docRes = await request.get(`${apiBase}/v1/documents/${docId}`, {
          headers: { origin: webOrigin },
        });
        if (!docRes.ok()) {
          return `document-${docRes.status()}`;
        }
        const doc = (await docRes.json()) as {
          status: string;
          extraction?: { layoutIrAvailable?: boolean };
        };
        if (doc.status === 'failed') {
          throw new Error('document extraction failed');
        }
        if (doc.status !== 'ready') {
          return `status-${doc.status}`;
        }
        if (doc.extraction?.layoutIrAvailable !== true) {
          return 'layout-ir-unavailable';
        }
        const irRes = await request.get(`${apiBase}/v1/documents/${docId}/layout-ir`, {
          headers: { origin: webOrigin },
        });
        if (!irRes.ok()) {
          return `layout-ir-${irRes.status()}`;
        }
        return 'ready';
      },
      { timeout: 280_000, intervals: [2000, 3000, 5000] }
    )
    .toBe('ready');
}
