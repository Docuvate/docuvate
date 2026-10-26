import path from 'node:path';

const storagePath = path.join(process.cwd(), '.auth', 'smoke-fixture-storage.json');

export function smokeFixtureStoragePath(): string {
  return storagePath;
}

/** Credentials used by `e2e/scripts/provision-smoke-storage.mjs` in CI smoke. */
export function smokeProvisionCredentials(): { email: string; password: string } {
  return {
    email: process.env['E2E_SMOKE_EMAIL'] ?? 'smoke.bench@fixture.docuvate.test',
    password: process.env['E2E_SMOKE_PASSWORD'] ?? 'SmokeBenchFixture1!',
  };
}

export function smokeFixtureCredentials(): { email: string; password: string } {
  return smokeProvisionCredentials();
}
