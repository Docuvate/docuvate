// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface PaperlessPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaperlessDocument {
  id: number;
  title: string;
  content: string | null;
  created: string;
  modified: string;
  added: string;
  archive_serial_number: number | null;
  original_file_name: string | null;
  mime_type: string | null;
  checksum: string | null;
  correspondent: number | null;
  document_type: number | null;
  storage_path: number | null;
  tags: number[];
  custom_fields: { field: number; value: unknown }[] | Record<string, unknown>;
  notes?: { note: string }[] | string | null;
  owner?: number | null;
}

export interface PaperlessTag {
  id: number;
  name: string;
  color: string;
  matching_algorithm: number;
  match: string;
}

export interface PaperlessCorrespondent {
  id: number;
  name: string;
  matching_algorithm: number;
  match: string;
}

export interface PaperlessDocumentType {
  id: number;
  name: string;
  matching_algorithm: number;
  match: string;
}

export interface PaperlessStoragePath {
  id: number;
  name: string;
  path: string;
  match: string;
  matching_algorithm: number;
}

export type PaperlessCustomFieldDataType =
  | 'string'
  | 'url'
  | 'date'
  | 'boolean'
  | 'integer'
  | 'float'
  | 'monetary'
  | 'documentlink'
  | 'select';

export interface PaperlessCustomField {
  id: number;
  name: string;
  data_type: PaperlessCustomFieldDataType;
  extra_data?: { select_options?: { id: string; label: string }[] } | null;
}
