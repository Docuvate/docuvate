import fs from 'node:fs';
import path from 'node:path';

function resolveSmokeStoragePath(): string {
  const fromPackageRoot = path.join(process.cwd(), '.auth', 'smoke-fixture-storage.json');
  const fromMonorepoRoot = path.join(process.cwd(), 'e2e', '.auth', 'smoke-fixture-storage.json');
  if (fs.existsSync(fromPackageRoot)) {
    return fromPackageRoot;
  }
  if (fs.existsSync(fromMonorepoRoot)) {
    return fromMonorepoRoot;
  }
  return fromPackageRoot;
}

export function smokeFixtureStoragePath(): string {
  return resolveSmokeStoragePath();
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
