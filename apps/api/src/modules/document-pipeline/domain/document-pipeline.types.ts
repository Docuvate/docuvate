// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Stable ids for post-OCR processing steps. A future settings UI can persist
 * `{ moduleId, enabled, order }[]` in user preferences and filter/sort against this list.
 */
export type DocumentPipelineModuleId =
  | 'label_matching'
  | 'embedding_suggestions'
  | 'global_recognized_fields'
  | 'label_attached_fields'
  | 'duplicate_detection';

export interface DocumentPipelineModuleDescriptor {
  id: DocumentPipelineModuleId;
  labelDe: string;
  descriptionDe: string;
  defaultEnabled: boolean;
  defaultOrder: number;
}

export interface DocumentPipelineContext {
  documentId: string;
  userId: string;
  /** Filename + title + OCR text — used by label matchers. */
  content: string;
}

export interface DocumentPipelineModule {
  readonly descriptor: DocumentPipelineModuleDescriptor;
  run(context: DocumentPipelineContext): Promise<void>;
}

/** OCR runs before this pipeline; listed here for future UI completeness. */
export const OCR_PIPELINE_DESCRIPTOR = {
  id: 'ocr' as const,
  labelDe: 'Text-Extraktion (OCR)',
  descriptionDe: 'Engine-basierte Texterkennung und Blöcke; immer erster Schritt.',
  defaultEnabled: true,
  defaultOrder: 0,
};
