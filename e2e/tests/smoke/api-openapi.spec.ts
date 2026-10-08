import { expect, test } from '@playwright/test';

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';

test.describe('API smoke', () => {
  test('health and OpenAPI are reachable on the compose stack', async ({ request }) => {
    const health = await request.get(`${apiBase}/health`);
    expect(health.ok()).toBeTruthy();

    const openapi = await request.get(`${apiBase}/v1/openapi.json`);
    expect(openapi.ok()).toBeTruthy();
    const json = (await openapi.json()) as { info?: { title?: string } };
    expect(json.info?.title).toBeTruthy();
  });
});
