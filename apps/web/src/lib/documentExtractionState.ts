// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, ExtractionBlock } from '@docuvate/contracts';

import i18n from '../i18n';
import { textFromExtractionBlocks } from './extractionLayout';

export function hasExtractedContent(
  doc: Pick<DocumentDto, 'extraction'>,
  blocks: ExtractionBlock[]
): boolean {
  const rawText = doc.extraction?.text;
  const text = rawText != null ? rawText.trim() : '';
  if (text.length > 0) return true;
  const fromBlocks = textFromExtractionBlocks(blocks).trim();
  return fromBlocks.length > 0 || blocks.length > 0;
}

export interface ExtractionFailurePresentation {
  userMessage: string;
  technicalDetail: string | null;
}

export function presentExtractionFailure(
  reason: string | null | undefined
): ExtractionFailurePresentation {
  const trimmed = reason?.trim() ?? '';
  if (!trimmed) {
    return {
      userMessage: i18n.t('documents.extractionFailedDetail'),
      technicalDetail: null,
    };
  }
  if (i18n.exists(trimmed)) {
    // The API stores typed failure codes as i18n keys.
    return {
      userMessage: i18n.t(trimmed),
      technicalDetail: null,
    };
  }
  // Reasons without a known i18n key are shown as technical detail behind a generic message.
  return {
    userMessage: i18n.t('documents.extractionFailedWorker'),
    technicalDetail: trimmed,
  };
}

export function extractionFailureMessage(doc: DocumentDto): string {
  if (doc.status !== 'failed') {
    return '';
  }
  return presentExtractionFailure(doc.extractionFailureReason).userMessage;
}

export function isExtractionPending(status: DocumentDto['status']): boolean {
  return status === 'uploaded' || status === 'queued' || status === 'extracting';
}
