// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * JSONB columns permitted on the Docuvate Postgres schema (ADR 015).
 * Any other JSONB column added in TypeORM migrations must be documented in the ADR first.
 */
export const SCHEMA_JSONB_ALLOWLIST = [
  { table: 'document_layout_ir', column: 'ir' },
  { table: 'document_embeddings', column: 'embedding' },
  { table: 'document_text_chunks', column: 'embedding' },
  { table: 'tag_embedding_centroids', column: 'centroid' },
  { table: 'extraction_arena_ratings', column: 'compare_snapshot' },
  { table: 'ml_training_data_snapshots', column: 'metadata' },
  { table: 'ml_model_versions', column: 'metrics' },
  { table: 'saved_document_views', column: 'visible_columns' },
  { table: 'embedding_density_user_state', column: 'class_bias' },
  { table: 'embedding_density_user_state', column: 'fine_ready_tag_ids' },
  { table: 'embedding_density_class_niw', column: 'sum_x' },
  { table: 'embedding_density_class_niw', column: 'sum_xx' },
] as const;

/** JSONB id-array and payload columns removed by the 3NF migration; they must not reappear. */
export const FORBIDDEN_JSONB_ID_ARRAY_COLUMNS = [
  'gate_label_ids',
  'field_extraction_required_label_ids',
  'label_tag_ids',
  'compared_engines',
  'extracted_fields',
] as const;
