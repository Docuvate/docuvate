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
import { HeuristicFieldSuggestions20261010150000 } from './migrations/20261010150000-heuristic-field-suggestions.js';
import { PurgeHeadingVendorSuggestions20261010153000 } from './migrations/20261010153000-purge-heading-vendor-suggestions.js';
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
  HeuristicFieldSuggestions20261010150000,
  PurgeHeadingVendorSuggestions20261010153000,
];

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
    expect(opts.migrations).toEqual(EXPECTED_MIGRATIONS);
    expect(InitialSchema20261008120000.name).toBe(TYPEORM_INITIAL_MIGRATION_NAME);
  });
});
