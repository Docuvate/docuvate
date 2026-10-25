// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { QueryRunner } from 'typeorm';

import { isRecord } from './row-parse.js';
import { TYPEORM_INITIAL_MIGRATION_NAME } from './typeorm-options.js';

/** Every registered migration must have a `migrationSchemaPresent` case (keep in sync with TypeORM order). */
export const BASELINE_MARKER_MIGRATION_NAMES = [
  TYPEORM_INITIAL_MIGRATION_NAME,
  'GlobalSearchSchema20261008130500',
  'DocumentFieldValuesBackfill20261008130600',
  'SearchIndexBackfill20261008130700',
  'SchemaNormalization3nf20261008131000',
  'AuthMfaPasskey20261008132100',
  'InstallationIam20261008132200',
  'SavedViewsDashboard20261008133000',
  'SftpIngress20261008133500',
  'DocumentExtractedLayoutIr20261008213000',
  'ConnectorPaperlessImport20261008234500',
  'CitedChat20261009120000',
  'StaleChatGeneration20261009183000',
  'EmbeddingDensity20261010120000',
  'EmbeddingDensityClassNiw20261010131500',
  'EmbeddingDensityReadinessSplit20261010140000',
  'HeuristicFieldSuggestions20261010150000',
  'PurgeHeadingVendorSuggestions20261010153000',
  'Corrections20261011180000',
  'RepairPeriodDuplicateStacks20261011200000',
  'DuplicatePairLabels20261011210000',
  'DocumentRepresentation20261012120000',
  'FeatureFlags20261013120000',
  'UserChatCloudLlm20261013120000',
  'SmartDuplicates20261013180000',
  'FeatureFlagMlKeys20261013200000',
  'DocumentExtractedFact20261013210000',
  'FeatureFlagLearnedValueTypes20261013220000',
  'ExactFactAnswerAbstention20261013230000',
  'DocumentRecognizedFieldExtractionAttempt20261014120000',
  'RepairHashOnlyDuplicateStacks20261014140000',
  'MappeDefaultRootFolders20261014150000',
  'SplitDuplicateStacksByContentHash20261014160000',
  'DocumentRecognizedFieldExtractorVersion20261014170000',
  'DocumentExtractionFailureHeuristicVersion20261015120000',
  'DocumentPreviewStorage20261015180000',
  'PurgeCentroidLabelSuggestions20261015193000',
  'PurgeVocabularyLabelSuggestions20261015200000',
  'LabelClusterDocumentExclusions20261017120000',
  'InstallationPasswordPolicy20261018120000',
  'FoldersOnlyRemoveMappen20261018140000',
  'DocumentExtractionImages20261018150000',
  'ConnectorNamedConnectionsSourceScope20261018160000',
  'InstallationOidcProvider20261018170000',
  'CorrespondentsToAbsenderField20261018180000',
  'RecognizedFieldGateLabelPolarity20261018190000',
  'DocumentFileSizeSavedViewDescription20261018190500',
  'ConnectorPaperlessImportRetry20261025120000',
  'DocumentTagsUserConfirmed20261025210000',
] as const;

async function featureFlagMlKeysConstraintPresent(runner: QueryRunner): Promise<boolean> {
  const rows: unknown = await runner.query(
    `SELECT pg_get_constraintdef(c.oid) AS def
     FROM pg_constraint c
     JOIN pg_class t ON c.conrelid = t.oid
     JOIN pg_namespace n ON t.relnamespace = n.oid
     WHERE n.nspname = 'public'
       AND t.relname = 'feature_flag'
       AND c.conname = 'feature_flag_key_check'`
  );
  const def = queryTextCell(rows, 'def');
  return def?.includes('exact_answers') ?? false;
}

function queryTextCell(rows: unknown, key: string): string | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const row: unknown = rows[0];
  if (!isRecord(row)) {
    return null;
  }
  const value = row[key];
  return typeof value === 'string' ? value : null;
}

export async function regClassExists(runner: QueryRunner, relation: string): Promise<boolean> {
  const rows: unknown = await runner.query(`SELECT to_regclass($1::text)::text AS reg`, [relation]);
  const reg = queryTextCell(rows, 'reg');
  return reg != null && reg.length > 0;
}

/** True after FoldersOnlyRemoveMappen (or equivalent): no mappen table or mappe_id columns. */
export async function foldersOnlySchemaPresent(runner: QueryRunner): Promise<boolean> {
  if (await regClassExists(runner, 'public.mappen')) {
    return false;
  }
  if (await columnExists(runner, 'folders', 'mappe_id')) {
    return false;
  }
  if (await columnExists(runner, 'documents', 'mappe_id')) {
    return false;
  }
  return true;
}

export async function columnExists(
  runner: QueryRunner,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const rows: unknown = await runner.query(
    `SELECT 1 AS ok
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Returns true when this migration's schema effects are already present (safe to stamp). */
export async function migrationSchemaPresent(
  runner: QueryRunner,
  migrationName: string
): Promise<boolean> {
  switch (migrationName) {
    case TYPEORM_INITIAL_MIGRATION_NAME:
      return regClassExists(runner, 'public.documents');
    case 'GlobalSearchSchema20261008130500':
      return regClassExists(runner, 'public.document_text_chunks');
    case 'DocumentFieldValuesBackfill20261008130600':
      return migrationSchemaPresent(runner, 'GlobalSearchSchema20261008130500');
    case 'SearchIndexBackfill20261008130700':
      return regClassExists(runner, 'public.search_vocabulary_terms');
    case 'SchemaNormalization3nf20261008131000':
      return regClassExists(runner, 'public.document_extraction_blocks');
    case 'AuthMfaPasskey20261008132100':
      return regClassExists(runner, 'public.passkey');
    case 'InstallationIam20261008132200':
      return regClassExists(runner, 'public.tenants');
    case 'SavedViewsDashboard20261008133000':
      return regClassExists(runner, 'public.saved_document_views');
    case 'SftpIngress20261008133500':
      return regClassExists(runner, 'public.sftp_ingress_accounts');
    case 'DocumentExtractedLayoutIr20261008213000':
      return regClassExists(runner, 'public.document_layout_ir');
    case 'ConnectorPaperlessImport20261008234500':
      return regClassExists(runner, 'public.connector_paperless_settings');
    case 'CitedChat20261009120000':
      return regClassExists(runner, 'public.chat_message_citations');
    case 'StaleChatGeneration20261009183000':
      return migrationSchemaPresent(runner, 'EmbeddingDensity20261010120000');
    case 'EmbeddingDensity20261010120000':
      return regClassExists(runner, 'public.embedding_density_calibration_run');
    case 'EmbeddingDensityClassNiw20261010131500':
      return columnExists(runner, 'embedding_density_class_niw', 'sum_x_f32');
    case 'EmbeddingDensityReadinessSplit20261010140000':
      return columnExists(runner, 'embedding_density_user_state', 'fine_ready_tag_ids');
    case 'HeuristicFieldSuggestions20261010150000':
      return migrationSchemaPresent(runner, 'Corrections20261011180000');
    case 'PurgeHeadingVendorSuggestions20261010153000':
      return migrationSchemaPresent(runner, 'Corrections20261011180000');
    case 'Corrections20261011180000':
      return regClassExists(runner, 'public.corrections');
    case 'RepairPeriodDuplicateStacks20261011200000':
      return migrationSchemaPresent(runner, 'DuplicatePairLabels20261011210000');
    case 'DuplicatePairLabels20261011210000':
      return regClassExists(runner, 'public.duplicate_pair_labels');
    case 'DocumentRepresentation20261012120000':
      return regClassExists(runner, 'public.document_representation');
    case 'FeatureFlags20261013120000':
      return regClassExists(runner, 'public.feature_flag');
    case 'UserChatCloudLlm20261013120000':
      return columnExists(runner, 'user_preferences', 'document_chat_cloud_base_url');
    case 'SmartDuplicates20261013180000':
      return migrationSchemaPresent(runner, 'UserChatCloudLlm20261013120000');
    case 'FeatureFlagMlKeys20261013200000':
      return featureFlagMlKeysConstraintPresent(runner);
    case 'DocumentExtractedFact20261013210000':
      return regClassExists(runner, 'public.document_extracted_fact');
    case 'FeatureFlagLearnedValueTypes20261013220000':
      return migrationSchemaPresent(runner, 'FeatureFlags20261013120000');
    case 'ExactFactAnswerAbstention20261013230000':
      return regClassExists(runner, 'public.tenant_exact_fact_chat_settings');
    case 'DocumentRecognizedFieldExtractionAttempt20261014120000':
      return regClassExists(runner, 'public.document_recognized_field_extraction_attempt');
    case 'RepairHashOnlyDuplicateStacks20261014140000':
      return migrationSchemaPresent(runner, 'DocumentRecognizedFieldExtractionAttempt20261014120000');
    case 'MappeDefaultRootFolders20261014150000':
      if (await foldersOnlySchemaPresent(runner)) {
        return true;
      }
      return migrationSchemaPresent(runner, 'RepairHashOnlyDuplicateStacks20261014140000');
    case 'SplitDuplicateStacksByContentHash20261014160000':
      return migrationSchemaPresent(runner, 'MappeDefaultRootFolders20261014150000');
    case 'DocumentRecognizedFieldExtractorVersion20261014170000':
      return columnExists(runner, 'document_recognized_field_extraction_attempt', 'extractor_version');
    case 'DocumentExtractionFailureHeuristicVersion20261015120000':
      return columnExists(runner, 'documents', 'extraction_failure_reason');
    case 'DocumentPreviewStorage20261015180000':
      return columnExists(runner, 'documents', 'preview_storage_key');
    case 'PurgeCentroidLabelSuggestions20261015193000':
      return migrationSchemaPresent(runner, 'DocumentPreviewStorage20261015180000');
    case 'PurgeVocabularyLabelSuggestions20261015200000':
      return migrationSchemaPresent(runner, 'PurgeCentroidLabelSuggestions20261015193000');
    case 'LabelClusterDocumentExclusions20261017120000':
      return regClassExists(runner, 'public.label_recommendation_cluster_exclusions');
    case 'InstallationPasswordPolicy20261018120000':
      return regClassExists(runner, 'public.installation_password_policy');
    case 'FoldersOnlyRemoveMappen20261018140000':
      return foldersOnlySchemaPresent(runner);
    case 'DocumentExtractionImages20261018150000':
      return regClassExists(runner, 'public.document_extraction_images');
    case 'ConnectorNamedConnectionsSourceScope20261018160000':
      return regClassExists(runner, 'public.connector_installation_source_scope');
    case 'InstallationOidcProvider20261018170000':
      return regClassExists(runner, 'public.installation_oidc_provider');
    case 'CorrespondentsToAbsenderField20261018180000':
      return regClassExists(runner, 'public.saved_document_view_field_filters');
    case 'RecognizedFieldGateLabelPolarity20261018190000':
      return columnExists(runner, 'recognized_field_definitions', 'gate_label_polarity');
    case 'DocumentFileSizeSavedViewDescription20261018190500':
      return columnExists(runner, 'documents', 'file_size_bytes');
    case 'ConnectorPaperlessImportRetry20261025120000':
      return columnExists(runner, 'connector_import_run_errors', 'source_document_title');
    case 'DocumentTagsUserConfirmed20261025210000':
      return columnExists(runner, 'document_tags', 'user_confirmed');
    default:
      return false;
  }
}
