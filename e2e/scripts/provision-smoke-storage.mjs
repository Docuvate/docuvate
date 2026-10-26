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

const ctx = await request.newContext();
const login = await ctx.post(`${apiBase}/api/auth/sign-in/email`, {
  headers: { origin: webOrigin },
  data: { email, password },
});
if (!login.ok()) {
  throw new Error(`smoke sign-in failed: ${login.status()} ${await login.text()}`);
}
await ctx.storageState({ path: storagePath });
await ctx.dispose();
console.log(`Wrote ${storagePath} for ${email}`);
