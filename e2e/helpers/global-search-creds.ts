import fs from 'node:fs';
import path from 'node:path';

const credsPath = path.join(process.cwd(), '.auth', 'global-search-creds.json');
const storagePath = path.join(process.cwd(), '.auth', 'global-search-storage.json');

export function readGlobalSearchCreds(): { email: string; password: string } {
  const raw = fs.readFileSync(credsPath, 'utf8');
  return JSON.parse(raw) as { email: string; password: string };
}

export function globalSearchCredsPath(): string {
  return credsPath;
}

export function globalSearchStoragePath(): string {
  return storagePath;
}
