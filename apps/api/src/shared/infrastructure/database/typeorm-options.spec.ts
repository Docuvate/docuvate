import { afterEach, describe, expect, it } from 'vitest';

import { AuthMfaPasskey20261008132100 } from './migrations/20261008132100-auth-mfa-passkey.js';
import { InitialSchema20261008120000 } from './migrations/20261008120000-initial-schema.js';
import { GlobalSearchSchema20261008130500 } from './migrations/20261008130500-global-search-schema.js';
import { DocumentFieldValuesBackfill20261008130600 } from './migrations/20261008130600-document-field-values-backfill.js';
import { SearchIndexBackfill20261008130700 } from './migrations/20261008130700-search-index-backfill.js';
import { SchemaNormalization3nf20261008131000 } from './migrations/20261008131000-schema-normalization-3nf.js';
import { InstallationIam20261008132200 } from './migrations/20261008132200-installation-iam.js';
import { SavedViewsDashboard20261008133000 } from './migrations/20261008133000-saved-views-dashboard.js';
import { SftpIngress20261008133500 } from './migrations/20261008133500-sftp-ingress.js';
import { DocumentExtractedLayoutIr20261008213000 } from './migrations/20261008213000-document-extracted-layout-ir.js';
import { ConnectorPaperlessImport20261008234500 } from './migrations/20261008234500-connector-paperless-import.js';
import { CitedChat20261009120000 } from './migrations/20261009120000-cited-chat.js';
import { StaleChatGeneration20261009183000 } from './migrations/20261009183000-stale-chat-generation.js';
import { EmbeddingDensity20261010120000 } from './migrations/20261010120000-embedding-density.js';
import { EmbeddingDensityClassNiw20261010131500 } from './migrations/20261010131500-embedding-density-class-niw.js';
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
import { LabelClusterDocumentExclusions20261017120000 } from './migrations/20261017120000-label-cluster-document-exclusions.js';
import { InstallationPasswordPolicy20261018120000 } from './migrations/20261018120000-installation-password-policy.js';
import { FoldersOnlyRemoveMappen20261018140000 } from './migrations/20261018140000-folders-only-remove-mappen.js';
import { DocumentExtractionImages20261018150000 } from './migrations/20261018150000-document-extraction-images.js';
import { ConnectorNamedConnectionsSourceScope20261018160000 } from './migrations/20261018160000-connector-named-connections-source-scope.js';
import { CorrespondentsToAbsenderField20261018180000 } from './migrations/20261018180000-correspondents-to-absender-field.js';
import { InstallationOidcProvider20261018170000 } from './migrations/20261018170000-installation-oidc-provider.js';
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
  LabelClusterDocumentExclusions20261017120000,
  InstallationPasswordPolicy20261018120000,
  FoldersOnlyRemoveMappen20261018140000,
  DocumentExtractionImages20261018150000,
  ConnectorNamedConnectionsSourceScope20261018160000,
  InstallationOidcProvider20261018170000,
  CorrespondentsToAbsenderField20261018180000,
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

  it('registers migrations in chronological order', () => {
    process.env['DATABASE_URL'] = 'postgres://u:p@localhost:5432/db';
    const options = buildTypeOrmOptions();
    expect(options.migrations).toEqual(EXPECTED_MIGRATIONS);
  });

  it('uses the initial migration name constant', () => {
    expect(TYPEORM_INITIAL_MIGRATION_NAME).toBe('InitialSchema20261008120000');
  });
});
