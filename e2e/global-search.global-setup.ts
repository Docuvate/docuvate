import fs from 'node:fs';
import path from 'node:path';
import { request as playwrightRequest } from '@playwright/test';
import { provisionGlobalSearchLibrary } from './helpers/global-search-fixture.js';
import { globalSearchCredsPath } from './helpers/global-search-creds.js';

const storagePath = path.join(process.cwd(), '.auth', 'global-search-storage.json');

export default async function globalSetup() {
  const apiBase = process.env['E2E_API_URL'] ?? 'http://localhost:3001';
  const webOrigin = process.env['E2E_WEB_ORIGIN'] ?? 'http://localhost:5173';

  fs.mkdirSync(path.dirname(globalSearchCredsPath()), { recursive: true });
  const ctx = await playwrightRequest.newContext();
  try {
    const creds = await provisionGlobalSearchLibrary(ctx, { apiBase, webOrigin });
    fs.writeFileSync(globalSearchCredsPath(), JSON.stringify(creds, null, 2));

    const login = await ctx.post(`${apiBase}/api/auth/sign-in/email`, {
      headers: { origin: webOrigin },
      data: { email: creds.email, password: creds.password },
    });
    if (!login.ok()) {
      throw new Error(`global-setup sign-in failed: ${login.status()} ${await login.text()}`);
    }
    await ctx.storageState({ path: storagePath });
  } finally {
    await ctx.dispose();
  }
}

export function globalSearchStoragePath(): string {
  return storagePath;
}
