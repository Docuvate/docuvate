import { runDatabaseMigrations } from './run-database-migrations.js';

runDatabaseMigrations().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
