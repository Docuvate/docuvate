import { afterEach, describe, expect, it } from 'vitest';
import { DocumentFieldValuesBackfill20261008130600 } from './migrations/20261008130600-document-field-values-backfill.js';
import { GlobalSearchSchema20261008130500 } from './migrations/20261008130500-global-search-schema.js';
import { InitialSchema20261008120000 } from './migrations/20261008120000-initial-schema.js';
import { JobOutbox20261105080000 } from './migrations/20261105080000-job-outbox.js';
import { SchemaNormalization3nf20261008131000 } from './migrations/20261008131000-schema-normalization-3nf.js';
import { SearchIndexBackfill20261008130700 } from './migrations/20261008130700-search-index-backfill.js';
import {
  TYPEORM_INITIAL_MIGRATION_NAME,
  buildTypeOrmOptions,
} from './typeorm-options.js';

describe('buildTypeOrmOptions', () => {
  const prev = process.env['DATABASE_URL'];

  afterEach(() => {
    if (prev === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = prev;
    }
  });

  it('requires DATABASE_URL', () => {
    delete process.env['DATABASE_URL'];
    expect(() => buildTypeOrmOptions()).toThrow(/DATABASE_URL/);
  });

  it('registers initial schema, global search, 3NF and job-outbox migrations in order', () => {
    process.env['DATABASE_URL'] = 'postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate';
    const opts = buildTypeOrmOptions();
    expect(opts.migrations).toEqual([
      InitialSchema20261008120000,
      GlobalSearchSchema20261008130500,
      DocumentFieldValuesBackfill20261008130600,
      SearchIndexBackfill20261008130700,
      SchemaNormalization3nf20261008131000,
      JobOutbox20261105080000,
    ]);
    expect(TYPEORM_INITIAL_MIGRATION_NAME).toBe('InitialSchema20261008120000');
    expect(new JobOutbox20261105080000().name).toBe('JobOutbox20261105080000');
  });
});
