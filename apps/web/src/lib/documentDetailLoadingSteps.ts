// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { isExtractionPending } from './documentExtractionState';

export type DocumentDetailLoadStepId = 'metadata' | 'preview' | 'pipeline';

export interface DocumentDetailLoadStepDef {
  id: DocumentDetailLoadStepId;
  labelKey: string;
}

export const DOCUMENT_DETAIL_LOAD_STEPS: DocumentDetailLoadStepDef[] = [
  { id: 'metadata', labelKey: 'documents.loadingStepMetadata' },
  { id: 'preview', labelKey: 'documents.loadingStepPreview' },
  { id: 'pipeline', labelKey: 'documents.loadingStepPipeline' },
];

export interface DocumentDetailLoadProgressInput {
  metadataReady: boolean;
  previewReady: boolean;
  pipelinePending: boolean;
}

export function resolveDocumentDetailLoadStep(
  input: DocumentDetailLoadProgressInput
): DocumentDetailLoadStepId {
  if (!input.metadataReady) {
    return 'metadata';
  }
  if (!input.previewReady) {
    return 'preview';
  }
  if (input.pipelinePending) {
    return 'pipeline';
  }
  return 'pipeline';
}

export function isDocumentPreviewPending(
  doc: Pick<DocumentDto, 'mimeType'> | null | undefined,
  previewData: ArrayBuffer | null | undefined,
  previewUrl?: string | null
): boolean {
  if (!doc?.mimeType) {
    return false;
  }
  const wantsPreview = doc.mimeType === 'application/pdf' || doc.mimeType.startsWith('image/');
  if (!wantsPreview) {
    return false;
  }
  return !previewData && !previewUrl;
}

export function isDocumentPipelinePending(
  doc: Pick<DocumentDto, 'status'> | null | undefined
): boolean {
  if (!doc) {
    return false;
  }
  return isExtractionPending(doc.status);
}
