import pg from 'pg';

let pool: pg.Pool | null = null;

export function getIntegrationPool(): pg.Pool {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required for integration tests');
  }
  pool ??= new pg.Pool({ connectionString: url, max: 4 });
  return pool;
}

export async function closeIntegrationPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
