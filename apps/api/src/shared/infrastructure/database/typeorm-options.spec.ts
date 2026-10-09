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

  it('registers initial schema, global search, 3NF, MFA, IAM, saved views, SFTP ingress, layout IR, and Paperless connector migrations in order', () => {
    process.env['DATABASE_URL'] = 'postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate';
    const opts = buildTypeOrmOptions();
    const migrations = opts.migrations as Array<{ name: string }>;
    expect(migrations).toHaveLength(11);
    expect(migrations[0]?.name).toBe(TYPEORM_INITIAL_MIGRATION_NAME);
    expect(migrations[1]?.name).toBe('GlobalSearchSchema20261008130500');
    expect(migrations[2]?.name).toBe('DocumentFieldValuesBackfill20261008130600');
    expect(migrations[3]?.name).toBe('SearchIndexBackfill20261008130700');
    expect(migrations[4]?.name).toBe('SchemaNormalization3nf20261008131000');
    expect(migrations[5]?.name).toBe('AuthMfaPasskey20261008132100');
    expect(migrations[6]?.name).toBe('InstallationIam20261008132200');
    expect(migrations[7]?.name).toBe('SavedViewsDashboard20261008133000');
    expect(migrations[8]?.name).toBe('SftpIngress20261008133500');
    expect(migrations[9]?.name).toBe('DocumentExtractedLayoutIr20261008213000');
    expect(migrations[10]?.name).toBe('ConnectorPaperlessImport20261008234500');
  });
});
