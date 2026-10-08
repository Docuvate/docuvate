import { afterEach, describe, expect, it } from 'vitest';
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

  it('registers the initial schema migration', () => {
    process.env['DATABASE_URL'] = 'postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate';
    const opts = buildTypeOrmOptions();
    const migrations = opts.migrations as Array<{ name: string }>;
    expect(migrations).toHaveLength(1);
    expect(migrations[0]?.name).toBe(TYPEORM_INITIAL_MIGRATION_NAME);
  });
});
