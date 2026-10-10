// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { InitialSchema20261008120000 } from './migrations/20261008120000-initial-schema.js';
import { GlobalSearchSchema20261008130500 } from './migrations/20261008130500-global-search-schema.js';
import { DocumentFieldValuesBackfill20261008130600 } from './migrations/20261008130600-document-field-values-backfill.js';
import { SearchIndexBackfill20261008130700 } from './migrations/20261008130700-search-index-backfill.js';
import { SchemaNormalization3nf20261008131000 } from './migrations/20261008131000-schema-normalization-3nf.js';
import { AuthMfaPasskey20261008132100 } from './migrations/20261008132100-auth-mfa-passkey.js';
import { InstallationIam20261008132200 } from './migrations/20261008132200-installation-iam.js';
import { SavedViewsDashboard20261008133000 } from './migrations/20261008133000-saved-views-dashboard.js';
import { SftpIngress20261008133500 } from './migrations/20261008133500-sftp-ingress.js';
import { DocumentExtractedLayoutIr20261008213000 } from './migrations/20261008213000-document-extracted-layout-ir.js';
import { ConnectorPaperlessImport20261008234500 } from './migrations/20261008234500-connector-paperless-import.js';
import { CitedChat20261009120000 } from './migrations/20261009120000-cited-chat.js';
import { StaleChatGeneration20261009183000 } from './migrations/20261009183000-stale-chat-generation.js';
import { EmbeddingDensity20261010120000 } from './migrations/20261010120000-embedding-density.js';
import { EmbeddingDensityClassNiw20261010131500 } from './migrations/20261010131500-embedding-density-f32.js';
import { EmbeddingDensityReadinessSplit20261010140000 } from './migrations/20261010140000-embedding-density-readiness-split.js';
import { buildTypeOrmOptions, TYPEORM_INITIAL_MIGRATION_NAME } from './typeorm-options.js';

const EXPECTED_MIGRATIONS = [
  InitialSchema20261008120000,
  GlobalSearchSchema20261008130500,
  DocumentFieldValuesBackfill20261008130600,
  SearchIndexBackfill20261008130700,
  SchemaNormalization3nf20261008131000,
  AuthMfaPasskey20261008132100,
  InstallationIam20261008132200,
  SavedViewsDashboard20261008133000,
  SftpIngress20261008133500,
  DocumentExtractedLayoutIr20261008213000,
  ConnectorPaperlessImport20261008234500,
  CitedChat20261009120000,
  StaleChatGeneration20261009183000,
  EmbeddingDensity20261010120000,
  EmbeddingDensityClassNiw20261010131500,
  EmbeddingDensityReadinessSplit20261010140000,
];

describe('buildTypeOrmOptions', () => {
  const prev = process.env.DATABASE_URL;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = prev;
    }
  });

  it('requires DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    expect(() => buildTypeOrmOptions()).toThrow(/DATABASE_URL/);
  });

  it('registers initial schema, global search, 3NF, MFA, IAM, saved views, SFTP ingress, layout IR, and Paperless connector migrations in order', () => {
    process.env.DATABASE_URL = 'postgresql://docuvate:docuvate@127.0.0.1:5432/docuvate';
    const opts = buildTypeOrmOptions();
<<<<<<< HEAD
    const migrations = opts.migrations as Array<{ name: string }>;
    expect(migrations).toHaveLength(18);
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
    expect(migrations[11]?.name).toBe('CitedChat20261009120000');
    expect(migrations[12]?.name).toBe('StaleChatGeneration20261009183000');
    expect(migrations[13]?.name).toBe('EmbeddingDensity20261010120000');
    expect(migrations[14]?.name).toBe('EmbeddingDensityClassNiw20261010131500');
    expect(migrations[15]?.name).toBe('EmbeddingDensityReadinessSplit20261010140000');
    expect(migrations[16]?.name).toBe('HeuristicFieldSuggestions20261010150000');
    expect(migrations[17]?.name).toBe('PurgeHeadingVendorSuggestions20261010153000');
=======
    expect(opts.migrations).toEqual(EXPECTED_MIGRATIONS);
    expect(InitialSchema20261008120000.name).toBe(TYPEORM_INITIAL_MIGRATION_NAME);
>>>>>>> 61e4967 (fix(api): satisfy strict ESLint and enable lint in CI)
  });
});
