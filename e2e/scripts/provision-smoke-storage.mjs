import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { request } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storagePath = path.join(__dirname, '../.auth/smoke-fixture-storage.json');

const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
const webOrigin = process.env['E2E_WEB_URL'] ?? 'http://localhost:5173';
const email = process.env['E2E_SMOKE_EMAIL'] ?? 'smoke.bench@fixture.docuvate.test';
const password = process.env['E2E_SMOKE_PASSWORD'] ?? 'SmokeBenchFixture1!';

fs.mkdirSync(path.dirname(storagePath), { recursive: true });

const MAX_SIGN_IN_ATTEMPTS = 5;
const DEFAULT_RETRY_SECONDS = 10;

/** Back-to-back CI steps can hit the auth sign-in throttle; wait it out instead of failing. */
function retryDelayMs(response) {
  const header = response.headers()['x-retry-after'] ?? response.headers()['retry-after'];
  const seconds = Number(header);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_SECONDS) * 1000 + 250;
}

const ctx = await request.newContext();
let login = await ctx.post(`${apiBase}/api/auth/sign-in/email`, {
  headers: { origin: webOrigin },
  data: { email, password },
});
for (let attempt = 1; login.status() === 429 && attempt < MAX_SIGN_IN_ATTEMPTS; attempt += 1) {
  const delay = retryDelayMs(login);
  console.log(`smoke sign-in throttled (429), retrying in ${delay} ms`);
  await new Promise((resolve) => setTimeout(resolve, delay));
  login = await ctx.post(`${apiBase}/api/auth/sign-in/email`, {
    headers: { origin: webOrigin },
    data: { email, password },
  });
}
if (!login.ok()) {
  throw new Error(`smoke sign-in failed: ${login.status()} ${await login.text()}`);
}
await ctx.storageState({ path: storagePath });
await ctx.dispose();
console.log(`Wrote ${storagePath} for ${email}`);
