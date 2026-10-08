import AppDataSource from './data-source.js';

/** Apply pending TypeORM migrations. */
export async function runDatabaseMigrations(): Promise<void> {
  const ds = await AppDataSource.initialize();
  try {
    await ds.runMigrations();
  } finally {
    await ds.destroy();
  }
}
