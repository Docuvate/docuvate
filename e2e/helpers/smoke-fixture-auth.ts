import path from 'node:path';

const storagePath = path.join(process.cwd(), '.auth', 'smoke-fixture-storage.json');

export function smokeFixtureStoragePath(): string {
  return storagePath;
}

export function smokeFixtureCredentials(): { email: string; password: string } {
  return {
    email: process.env['E2E_SMOKE_EMAIL'] ?? 'alex.upload@fixture.docuvate.test',
    password: process.env['E2E_SMOKE_PASSWORD'] ?? 'E2eSmokeFixture1!',
  };
}
