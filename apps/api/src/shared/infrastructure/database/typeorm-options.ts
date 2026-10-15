// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DataSourceOptions } from 'typeorm';

import { TYPEORM_ENTITIES } from './entities/index.js';
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
import { Corrections20261011180000 } from './migrations/20261011180000-corrections.js';
import { RepairPeriodDuplicateStacks20261011200000 } from './migrations/20261011200000-repair-period-duplicate-stacks.js';
import { DuplicatePairLabels20261011210000 } from './migrations/20261011210000-duplicate-pair-labels.js';
import { DocumentRepresentation20261012120000 } from './migrations/20261012120000-document-representation.js';
import { FeatureFlags20261013120000 } from './migrations/20261013120000-feature-flags.js';
import { UserChatCloudLlm20261013120000 } from './migrations/20261013120000-user-chat-cloud-llm.js';
import { SmartDuplicates20261013180000 } from './migrations/20261013180000-smart-duplicates.js';
import { FeatureFlagMlKeys20261013200000 } from './migrations/20261013200000-feature-flag-ml-keys.js';
import { DocumentExtractedFact20261013210000 } from './migrations/20261013210000-document-extracted-fact.js';
import { FeatureFlagLearnedValueTypes20261013220000 } from './migrations/20261013220000-feature-flag-learned-value-types.js';
import { ExactFactAnswerAbstention20261013230000 } from './migrations/20261013230000-exact-fact-answer-abstention.js';
import { DocumentRecognizedFieldExtractionAttempt20261014120000 } from './migrations/20261014120000-document-recognized-field-extraction-attempt.js';
import { RepairHashOnlyDuplicateStacks20261014140000 } from './migrations/20261014140000-repair-hash-only-duplicate-stacks.js';
import { MappeDefaultRootFolders20261014150000 } from './migrations/20261014150000-mappe-default-root-folders.js';
import { SplitDuplicateStacksByContentHash20261014160000 } from './migrations/20261014160000-split-duplicate-stacks-by-content-hash.js';
import { DocumentRecognizedFieldExtractorVersion20261014170000 } from './migrations/20261014170000-document-recognized-field-extractor-version.js';
import { DocumentExtractionFailureHeuristicVersion20261015120000 } from './migrations/20261015120000-document-extraction-failure-heuristic-version.js';
import { DocumentPreviewStorage20261015180000 } from './migrations/20261015180000-document-preview-storage.js';
import { PurgeCentroidLabelSuggestions20261015193000 } from './migrations/20261015193000-purge-centroid-label-suggestions.js';
import { PurgeVocabularyLabelSuggestions20261015200000 } from './migrations/20261015200000-purge-vocabulary-label-suggestions.js';

export const TYPEORM_INITIAL_MIGRATION_TIMESTAMP = 20261008120000;
export const TYPEORM_INITIAL_MIGRATION_NAME = 'InitialSchema20261008120000';

/** Set only by `scripts/export-openapi.mts` to skip TypeORM during OpenAPI export; `main.ts` refuses to boot when this is set. */
export function isOpenApiHeadlessMode(): boolean {
  return process.env['DOCUVATE_OPENAPI_HEADLESS'] === '1';
}

/** Vitest contract suite (`vitest.contract.config.ts`); skips TypeORM like headless export without using `DOCUVATE_OPENAPI_HEADLESS`. */
export function isOpenApiContractTestMode(): boolean {
  return process.env['DOCUVATE_OPENAPI_CONTRACT'] === '1';
}

export function buildTypeOrmOptions(): DataSourceOptions {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  return {
    type: 'postgres',
    url,
    entities: [...TYPEORM_ENTITIES],
    migrations: [
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
      Corrections20261011180000,
      RepairPeriodDuplicateStacks20261011200000,
      DuplicatePairLabels20261011210000,
      DocumentRepresentation20261012120000,
      FeatureFlags20261013120000,
      UserChatCloudLlm20261013120000,
      SmartDuplicates20261013180000,
      FeatureFlagMlKeys20261013200000,
      DocumentExtractedFact20261013210000,
      FeatureFlagLearnedValueTypes20261013220000,
      ExactFactAnswerAbstention20261013230000,
      DocumentRecognizedFieldExtractionAttempt20261014120000,
      RepairHashOnlyDuplicateStacks20261014140000,
      MappeDefaultRootFolders20261014150000,
      SplitDuplicateStacksByContentHash20261014160000,
      DocumentRecognizedFieldExtractorVersion20261014170000,
      DocumentExtractionFailureHeuristicVersion20261015120000,
      DocumentPreviewStorage20261015180000,
      PurgeCentroidLabelSuggestions20261015193000,
      PurgeVocabularyLabelSuggestions20261015200000,
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'each',
    logging: process.env['TYPEORM_LOGGING'] === 'true',
  };
}
