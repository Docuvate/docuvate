import { afterAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { startPostgresContainer } from '@docuvate/testing/containers';

/** Tables whose PK uses DEFAULT gen_random_uuid() in baseline SQL (sample of @PrimaryGeneratedColumn entities). */
const UUID_PK_TABLES = ['chat_messages', 'chat_threads', 'document_duplicate_candidates'] as const;

describe('TypeORM uuid primary keys vs baseline schema', () => {
  let pool: pg.Pool | undefined;

  afterAll(async () => {
    await pool?.end();
  });

  it('keeps gen_random_uuid() defaults after migrations', async () => {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL missing (integration globalSetup)');

    pool = new pg.Pool({ connectionString: url });
    for (const table of UUID_PK_TABLES) {
      const { rows } = await pool.query<{ column_default: string | null }>(
        `SELECT column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'`,
        [table]
      );
      expect(rows[0]?.column_default ?? '', table).toMatch(/gen_random_uuid\(\)/);
    }
  });
});
