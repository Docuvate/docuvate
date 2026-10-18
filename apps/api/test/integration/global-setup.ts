import { writeFileSync } from 'node:fs';

import { startPostgresContainer } from '../../../../packages/testing/src/containers/index.js';

const ENV_FILE = '/tmp/docuvate-integration-env.json';

export default async function globalSetup(): Promise<() => Promise<void>> {
  const postgres = await startPostgresContainer();
  process.env.DATABASE_URL = postgres.url;
  const { runDatabaseMigrations } =
    await import('../../src/shared/infrastructure/database/run-database-migrations.js');
  await runDatabaseMigrations();
  writeFileSync(
    ENV_FILE,
    JSON.stringify({
      databaseUrl: postgres.url,
    }),
    'utf8'
  );
  return async () => {
    await postgres.stop();
  };
}
