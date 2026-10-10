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

export function extractionFailureMessage(doc: DocumentDto): string {
  if (doc.status !== 'failed') {
    return '';
  }
  return i18n.t('documents.extractionFailedDetail');
}

export function isExtractionPending(status: DocumentDto['status']): boolean {
  return status === 'uploaded' || status === 'queued' || status === 'extracting';
}
